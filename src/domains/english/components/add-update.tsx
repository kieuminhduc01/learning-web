"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import "@/utils/time";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { v7 as uuidv7 } from 'uuid';

import { addDays, formatTime } from "@/utils/time";

interface AddUpdateVocabularyModalProps {
  vocabulary?: Vocabulary; // nếu undefined => add mới
  onUpdate?: (v: Vocabulary) => void;
}

const STEP_OPTIONS = ["0", "1", "2", "3-6", "7-15", "16-30", "30-50", "0-50"];
const PART_OF_SPEECH_OPTIONS = [
  "noun",
  "pronoun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "interjection",
  "other"
];

export default function AddUpdateVocabularyModal({ vocabulary, onUpdate }: AddUpdateVocabularyModalProps) {
  const now = new Date();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Vocabulary, "id" | "target">>({
    english: "",
    vietnamese: "",
    ipa: "",
    example: "",
    collection: "",
    partOfSpeech: "",
    step: "0",
  });
  const [target, setTarget] = useState(now);

  useEffect(() => {
    if (vocabulary) {
      const { target, ...rest } = vocabulary;
      setForm(rest);
      setTarget(new Date(target) || now);
    }
  }, [vocabulary]);

  const computeTarget = (step: string) => {
    let daysToAdd = 0;
    if (step === "0") daysToAdd = 0;
    else if (step === "1") daysToAdd = 1;
    else if (step === "2") daysToAdd = 2;
    else if (step.includes("-")) {
      const [min, max] = step.split("-").map(Number);
      daysToAdd = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (step === "0-50") {
      daysToAdd = Math.floor(Math.random() * 51);
    } else {
      daysToAdd = Number(step) || 0;
    }
    return addDays(now,daysToAdd);
  };

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "step") {
      setTarget(computeTarget(value));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSend = {
        ...form,
        target: computeTarget(form.step),
        id: vocabulary?.id || uuidv7(),
      };
      const res = await fetch("/api/vocabularies", {
        method: vocabulary ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const data = await res.json();
      onUpdate?.(data); 
      setOpen(false);
      if (!vocabulary) {
        setForm({
          english: "",
          vietnamese: "",
          ipa: "",
          example: "",
          collection: "",
          partOfSpeech: "",
          step: "0",
        });
        setTarget(new Date());
      }
    } catch (err) {
      console.error(err);
      alert("Lưu không thành công");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {vocabulary ? (
          <Button variant="outline" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm mới
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl w-full max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{vocabulary ? "Chỉnh sửa từ vựng" : "Thêm từ vựng mới"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>English</Label>
            <Textarea
              value={form.english}
              onChange={(e) => handleChange("english", e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label>Vietnamese</Label>
            <Textarea
              value={form.vietnamese}
              onChange={(e) => handleChange("vietnamese", e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label>IPA</Label>
            <Textarea
              value={form.ipa}
              onChange={(e) => handleChange("ipa", e.target.value)}
              rows={1}
            />
          </div>
          <div>
            <Label>Example</Label>
            <Textarea
              value={form.example}
              onChange={(e) => handleChange("example", e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Collection</Label>
            <Textarea
              value={form.collection}
              onChange={(e) => handleChange("collection", e.target.value)}
              rows={1}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Part of Speech</Label>
              <Select
                value={form.partOfSpeech}
                onValueChange={(v) => handleChange("partOfSpeech", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PART_OF_SPEECH_OPTIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Step</Label>
              <Select
                value={form.step}
                onValueChange={(v) => handleChange("step", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEP_OPTIONS.map((step) => (
                    <SelectItem key={step} value={step}>{step}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Target</Label>
              <Input type="text" value={formatTime(target,"YYYY-MM-DD")} disabled />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
