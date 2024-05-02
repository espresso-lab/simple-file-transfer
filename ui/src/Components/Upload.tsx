import { ChangeEvent } from "react";
import classes from "./Upload.module.scss";
export function Upload() {
  function onDropFiles(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    [...(fileList ?? [])].map(async (file) => {
      let { upload_url, download_url } = await fetch(
        "http://localhost:4000/upload-url",
        {
          method: "POST",
          body: JSON.stringify({ file_name: file.name, expires_in_secs: 3600 }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((res) => res.json());
      upload_url = upload_url.replace(
        "example.minio:9000",
        "localhost:9000/example"
      );
      const res = await fetch(upload_url, {
        method: "PUT",
        body: file,
      });
      if (!res.ok) {
        console.error("Failed to upload file");
        return;
      }
      navigator.clipboard.writeText(download_url);
    });
  }

  return (
    <div className={classes.dropzone}>
      <form className={classes.form}>
        <input onChange={onDropFiles} name="files" type="file" multiple />
        <label htmlFor="files">Drop it like it's hot.</label>
      </form>
    </div>
  );
}
