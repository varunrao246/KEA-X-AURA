"use client";

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Lesson } from "@/content/lessons";

/** "Try a simpler explanation": the core idea, one everyday comparison and one worked example, and nothing else. */
export function SimplerExplanation({ open, onClose, lesson, analogy, topicName, onPractice }: { open: boolean; onClose: () => void; lesson?: Lesson; analogy?: string; topicName: string; onPractice: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${topicName}, in simpler words`}
      className="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={() => { onClose(); onPractice(); }}>Try a question again</Button>
        </>
      }
    >
      {lesson ? (
        <div className="space-y-4">
          <p className="text-lg font-medium leading-snug">{lesson.bigIdea}</p>
          {analogy && (
            <p className="flex gap-3 rounded-2xl bg-accent-soft p-4 text-[15px]">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              {analogy}
            </p>
          )}
          {lesson.example && (
            <div>
              <p className="t-eyebrow mb-2">{lesson.example.title}</p>
              <ol className="space-y-1.5 text-[15px]">
                {lesson.example.steps.map((s, i) => (
                  <li key={s} className="flex gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-subtle text-[11px] font-semibold text-muted">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="mt-3 rounded-xl bg-success-soft px-4 py-2.5 font-semibold text-success">{lesson.example.result}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="t-body">Simpler notes for this topic are coming soon.</p>
      )}
    </Modal>
  );
}
