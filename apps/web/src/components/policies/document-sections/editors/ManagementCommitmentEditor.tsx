import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ManagementCommitmentEditorProps {
  data?: { statement?: string; signatory?: string; signatoryTitle?: string };
  onChange: (data: unknown) => void;
}

export function ManagementCommitmentEditor({
  data,
  onChange,
}: ManagementCommitmentEditorProps) {
  const [statement, setStatement] = useState(data?.statement || "");
  const [signatory, setSignatory] = useState(data?.signatory || "");
  const [signatoryTitle, setSignatoryTitle] = useState(data?.signatoryTitle || "");

  const handleChange = () => {
    onChange({ statement, signatory, signatoryTitle });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Commitment Statement</Label>
        <Textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          onBlur={handleChange}
          placeholder="Enter the management commitment statement..."
          className="min-h-[150px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Signatory Name</Label>
          <Input
            value={signatory}
            onChange={(e) => setSignatory(e.target.value)}
            onBlur={handleChange}
            placeholder="e.g., John Smith"
          />
        </div>
        <div className="space-y-2">
          <Label>Signatory Title</Label>
          <Input
            value={signatoryTitle}
            onChange={(e) => setSignatoryTitle(e.target.value)}
            onBlur={handleChange}
            placeholder="e.g., Chief Executive Officer"
          />
        </div>
      </div>
    </div>
  );
}
