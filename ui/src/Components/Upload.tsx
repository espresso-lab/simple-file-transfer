import { ChangeEvent, useState } from "react";
import classes from "./Upload.module.scss";
export function Upload() {
  const [files, setFiles] = useState<File[]>([]);

  function onDropFiles(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    setFiles([...(fileList ?? [])]);
    uploadFiles();
  }

  async function uploadFiles() {
    files.map(async (file) => {
      const response = await fetch("http://localhost:4000/upload-url", {
        method: "POST",
        body: JSON.stringify({ file_name: file.name, expires_in_secs: 3600 }),
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
      <div className={classes.list}>
        {files.map((file, index) => (
          <div key={index}>{file.name}</div>
        ))}
      </div>
    </div>
  );
}
