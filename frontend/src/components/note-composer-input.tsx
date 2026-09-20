import type { KeyboardEvent } from "react";

type NoteComposerInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
  invalid: boolean;
  describedBy: string;
};

export function NoteComposerInput({
  value,
  onValueChange,
  disabled,
  invalid,
  describedBy,
}: NoteComposerInputProps) {
  function submitWithKeyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <>
      <label htmlFor="source-text" className="sr-only">
        Fleet note
      </label>
      <textarea
        id="source-text"
        name="source_text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={submitWithKeyboard}
        required
        maxLength={2000}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        placeholder="Describe one vehicle issue…"
        rows={3}
        className="block w-full resize-none rounded-lg p-2 outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:bg-white"
      />
    </>
  );
}
