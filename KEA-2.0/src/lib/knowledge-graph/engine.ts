import { ConceptNode, GraphValidationResult, NodeUnlockState } from "./types";

export class KnowledgeGraphEngine {
  private readonly nodesMap = new Map<string, ConceptNode>();
  private readonly dependentsMap = new Map<string, string[]>();
  private readonly prerequisitesMap = new Map<string, string[]>();
  private readonly cachedTopologicalOrder: string[];

  constructor(nodes: ConceptNode[]) {
    // 1. Validation & Indexing
    const validation = KnowledgeGraphEngine.validateNodes(nodes);
    if (!validation.valid) {
      throw new Error(`Invalid Knowledge Graph: ${validation.errors.join("; ")}`);
    }

    // 2. Build In-Memory Adjacency Indices
    for (const node of nodes) {
      this.nodesMap.set(node.id, Object.freeze({ ...node }));
      this.prerequisitesMap.set(node.id, [...node.prerequisites]);
      if (!this.dependentsMap.has(node.id)) {
        this.dependentsMap.set(node.id, []);
      }
    }

    for (const node of nodes) {
      for (const prereqId of node.prerequisites) {
        const dependents = this.dependentsMap.get(prereqId);
        if (dependents) {
          dependents.push(node.id);
        }
      }
    }

    this.cachedTopologicalOrder = validation.topologicalOrder;
  }

  /**
   * Static validation of nodes array checking for:
   * 1. Duplicate IDs
   * 2. Dangling prerequisite references
   * 3. Self-referential prerequisites
   * 4. Cycles (via Kahn's Algorithm)
   */
  public static validateNodes(nodes: ConceptNode[]): GraphValidationResult {
    const errors: string[] = [];
    const nodeIds = new Set<string>();
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    // Check for duplicate IDs and initialize graphs
    for (const node of nodes) {
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate concept node ID: "${node.id}"`);
      }
      nodeIds.add(node.id);
      inDegree.set(node.id, 0);
      adj.set(node.id, []);
    }

    // Check for dangling prerequisites and self-references
    for (const node of nodes) {
      for (const prereqId of node.prerequisites) {
        if (prereqId === node.id) {
          errors.push(`Node "${node.id}" cannot list itself as a prerequisite.`);
        }
        if (!nodeIds.has(prereqId)) {
          errors.push(`Node "${node.id}" references unknown prerequisite ID "${prereqId}".`);
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, topologicalOrder: [] };
    }

    // Build edges for Kahn's algorithm: prereq -> dependent
    for (const node of nodes) {
      for (const prereqId of node.prerequisites) {
        adj.get(prereqId)!.push(node.id);
        inDegree.set(node.id, (inDegree.get(node.id) ?? 0) + 1);
      }
    }

    // Queue nodes with in-degree 0 (roots with no prerequisites)
    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    // Sort roots deterministically by orderIndex
    queue.sort((a, b) => {
      const nodeA = nodes.find(n => n.id === a);
      const nodeB = nodes.find(n => n.id === b);
      return (nodeA?.orderIndex ?? 0) - (nodeB?.orderIndex ?? 0);
    });

    const topologicalOrder: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      topologicalOrder.push(current);

      const neighbors = adj.get(current) ?? [];
      for (const neighbor of neighbors) {
        const newDeg = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) {
          queue.push(neighbor);
          queue.sort((a, b) => {
            const nodeA = nodes.find(n => n.id === a);
            const nodeB = nodes.find(n => n.id === b);
            return (nodeA?.orderIndex ?? 0) - (nodeB?.orderIndex ?? 0);
          });
        }
      }
    }

    if (topologicalOrder.length !== nodes.length) {
      const cyclicNodes = nodes
        .filter(n => !topologicalOrder.includes(n.id))
        .map(n => n.id);
      errors.push(
        `Cycle detected in knowledge graph involving nodes: ${cyclicNodes.join(", ")}`
      );
      return { valid: false, errors, topologicalOrder: [] };
    }

    return { valid: true, errors: [], topologicalOrder };
  }

  /**
   * Retrieves a single node by its stable ID.
   */
  public getNode(id: string): ConceptNode | undefined {
    return this.nodesMap.get(id);
  }

  /**
   * Returns all concept nodes in the graph in topological sequence.
   */
  public getAllNodes(): ConceptNode[] {
    return this.cachedTopologicalOrder.map(id => this.nodesMap.get(id)!);
  }

  /**
   * Returns total count of nodes.
   */
  public getNodeCount(): number {
    return this.nodesMap.size;
  }

  /**
   * Returns deterministic topological order of all node IDs.
   */
  public getTopologicalOrder(): string[] {
    return [...this.cachedTopologicalOrder];
  }

  /**
   * Returns immediate prerequisites of a node.
   */
  public getDirectPrerequisites(nodeId: string): ConceptNode[] {
    const prereqIds = this.prerequisitesMap.get(nodeId) ?? [];
    return prereqIds.map(id => this.nodesMap.get(id)!);
  }

  /**
   * Returns immediate dependent concepts that directly rely on this node.
   */
  public getDirectDependents(nodeId: string): ConceptNode[] {
    const dependentIds = this.dependentsMap.get(nodeId) ?? [];
    return dependentIds.map(id => this.nodesMap.get(id)!);
  }

  /**
   * Returns all transitive ancestor prerequisites in topological order.
   */
  public getAncestorPrerequisites(nodeId: string): ConceptNode[] {
    if (!this.nodesMap.has(nodeId)) return [];

    const ancestors = new Set<string>();
    const stack = [...(this.prerequisitesMap.get(nodeId) ?? [])];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (!ancestors.has(current)) {
        ancestors.add(current);
        const nextPrereqs = this.prerequisitesMap.get(current) ?? [];
        for (const p of nextPrereqs) {
          if (!ancestors.has(p)) {
            stack.push(p);
          }
        }
      }
    }

    return this.cachedTopologicalOrder
      .filter(id => ancestors.has(id))
      .map(id => this.nodesMap.get(id)!);
  }

  /**
   * Returns all transitive descendant concepts that directly or indirectly
   * depend on this node.
   */
  public getDescendantDependents(nodeId: string): ConceptNode[] {
    if (!this.nodesMap.has(nodeId)) return [];

    const descendants = new Set<string>();
    const stack = [...(this.dependentsMap.get(nodeId) ?? [])];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (!descendants.has(current)) {
        descendants.add(current);
        const nextDeps = this.dependentsMap.get(current) ?? [];
        for (const d of nextDeps) {
          if (!descendants.has(d)) {
            stack.push(d);
          }
        }
      }
    }

    return this.cachedTopologicalOrder
      .filter(id => descendants.has(id))
      .map(id => this.nodesMap.get(id)!);
  }

  /**
   * Inspects detailed unlock state for a specific concept node given a set of mastered IDs.
   */
  public getNodeUnlockState(nodeId: string, masteredIds: Iterable<string>): NodeUnlockState {
    const node = this.nodesMap.get(nodeId);
    if (!node) {
      throw new Error(`Concept node "${nodeId}" not found in graph.`);
    }

    const masteredSet = masteredIds instanceof Set ? masteredIds : new Set(masteredIds);
    const metPrerequisites: string[] = [];
    const unmetPrerequisites: string[] = [];

    for (const prereqId of node.prerequisites) {
      if (masteredSet.has(prereqId)) {
        metPrerequisites.push(prereqId);
      } else {
        unmetPrerequisites.push(prereqId);
      }
    }

    return {
      nodeId,
      isUnlocked: unmetPrerequisites.length === 0,
      metPrerequisites,
      unmetPrerequisites,
    };
  }

  /**
   * Checks whether a concept node is unlocked.
   * A concept is unlocked if and only if all of its direct prerequisites
   * have been mastered.
   */
  public isUnlocked(nodeId: string, masteredIds: Iterable<string>): boolean {
    return this.getNodeUnlockState(nodeId, masteredIds).isUnlocked;
  }

  /**
   * Returns all concepts whose prerequisites are fully satisfied.
   */
  public getUnlockedNodes(masteredIds: Iterable<string>): ConceptNode[] {
    const masteredSet = masteredIds instanceof Set ? masteredIds : new Set(masteredIds);
    return this.getAllNodes().filter(node => this.isUnlocked(node.id, masteredSet));
  }

  /**
   * Returns all concepts whose prerequisites are NOT yet satisfied.
   */
  public getLockedNodes(masteredIds: Iterable<string>): ConceptNode[] {
    const masteredSet = masteredIds instanceof Set ? masteredIds : new Set(masteredIds);
    return this.getAllNodes().filter(node => !this.isUnlocked(node.id, masteredSet));
  }

  /**
   * Recommends the next actionable concepts to attempt:
   * Unlocked concepts that the student has neither mastered nor is currently attempting.
   */
  public getAvailableNextNodes(
    masteredIds: Iterable<string>,
    inProgressIds?: Iterable<string>
  ): ConceptNode[] {
    const masteredSet = masteredIds instanceof Set ? masteredIds : new Set(masteredIds);
    const inProgressSet = inProgressIds ? (inProgressIds instanceof Set ? inProgressIds : new Set(inProgressIds)) : new Set<string>();

    return this.getAllNodes().filter(node => {
      if (masteredSet.has(node.id)) return false;
      if (inProgressSet.has(node.id)) return false;
      return this.isUnlocked(node.id, masteredSet);
    });
  }

  /**
   * Identifies the optimal remediation target when a student is struggling on a node.
   * Traverses backward through prerequisites and returns the ancestor node with the lowest
   * mastery score.
   */
  public getRemediationTarget(
    strugglingNodeId: string,
    masteryScores: Record<string, number>
  ): ConceptNode | undefined {
    const ancestors = this.getAncestorPrerequisites(strugglingNodeId);
    if (ancestors.length === 0) return undefined;

    let weakestNode: ConceptNode = ancestors[0];
    let lowestScore = masteryScores[weakestNode.id] ?? 0;

    for (const ancestor of ancestors) {
      const score = masteryScores[ancestor.id] ?? 0;
      if (score < lowestScore) {
        lowestScore = score;
        weakestNode = ancestor;
      }
    }

    return weakestNode;
  }
}
