import { ChangeEvent, useTransition } from "react";
import classes from "./Upload.module.scss";
import { useNotifications } from "../Context";
import { copy } from "../Utils";
import CopyIcon from "../Icons/copy.svg";

export function Upload() {
  const uploadUrl =
    location.hostname === "localhost"
      ? "http://localhost:3000/upload-url"
      : "/upload-url";
  const [isPending, startTransition] = useTransition();
  const { notify } = useNotifications();
  function onDropFiles(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    startTransition(function () {
      [...(fileList ?? [])].map(async (file) => {
        let { upload_url, download_url } = await fetch(uploadUrl, {
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

        copy(download_url)
          .then(() =>
            notify({
              type: "success",
              message: "Link copied to clipboard.",
            })
          )
          .catch(() =>
            notify({
              type: "info",
              message: "Click here to copy the download link.",
              duration: 10000,
              actionIcon: CopyIcon,
              onAction: () =>
                copy(download_url).then(() =>
                  notify({
                    type: "success",
                    message: "Link copied to clipboard.",
                  })
                ),
            })
          );
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
