export type NoteStatusState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export type NoteStatusAction = (
  previousState: NoteStatusState,
  formData: FormData,
) => Promise<NoteStatusState>;

export const initialNoteStatusState: NoteStatusState = {
  status: "idle",
  message: "",
};
