import { ChangeEvent } from "react";
import classes from "./Upload.module.scss";
export function Upload() {
  function onDropFiles(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    [...(fileList ?? [])].map(async (file) => {
      console.log(file);
      const response = await fetch("http://localhost:4000/upload-url", {
        method: "POST",
        body: JSON.stringify({ file_name: file.name, expires_in_secs: 3600 }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
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
