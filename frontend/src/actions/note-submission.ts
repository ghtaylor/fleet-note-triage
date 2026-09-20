export type NoteSubmissionState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export type NoteSubmissionAction = (
  previousState: NoteSubmissionState,
  formData: FormData,
) => Promise<NoteSubmissionState>;

export const initialNoteSubmissionState: NoteSubmissionState = {
  status: "idle",
  message: "",
};
