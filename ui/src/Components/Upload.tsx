import { ChangeEvent, useTransition } from "react";
import classes from "./Upload.module.scss";
import { useNotifications } from "../Context";

export function Upload() {
  const [isPending, startTransition] = useTransition();
  const { notify } = useNotifications();
  function onDropFiles(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    startTransition(async function () {
      [...(fileList ?? [])].map(async (file) => {
        let { upload_url, download_url } = await fetch("/upload-url", {
          method: "POST",
          body: JSON.stringify({
            file_name: file.name,
            expires_in_secs: 3600,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }).then((res) => res.json());
        const res = await fetch(upload_url, {
          method: "PUT",
          body: file,
        });
        if (!res.ok) {
          console.error("Failed to upload file");
          return;
        }
        navigator.clipboard.writeText(download_url);
        notify({
          message: "Download link copied to clipboard",
        });
      });
      return;
    });
  }

  return (
    <div className={classes.dropzone}>
      <form className={classes.form}>
        <input
          disabled={isPending}
          onChange={onDropFiles}
          name="files"
          type="file"
          multiple
        />
        <label htmlFor="files">
          {isPending ? "Loading..." : "Drop it like it's hot 🔥"}
        </label>
      </form>
    </div>
  );
}
