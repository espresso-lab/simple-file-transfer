# Simple File Transfer

A web app for simple and secure file sharing.


[![GitHub tag](https://img.shields.io/github/tag/espresso-lab/simple-file-transfer?include_prereleases=&sort=semver&color=blue)](https://github.com/espresso-lab/simple-file-transfer/tags/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)
[![Rust Report Card](https://rust-reportcard.xuri.me/badge/github.com/espresso-lab/simple-file-transfer)](https://rust-reportcard.xuri.me/report/github.com/espresso-lab/simple-file-transfer)

## Features

- Upload files via drag'n'drop or via the "+" icon
- Generate a secure shareable link (implemented via S3 presigned urls)
- Blazing fast backend ⚡️ written in Rust ⚙️
- Clean and minimalistic UI 
- Upload files to S3 or S3 compatible storage (e.g. MinIO)
- Shipped as a single container image

## Demo

https://github.com/user-attachments/assets/97a12fc7-1add-43bc-bd00-6174f802a1cc

## Further infos

- Issues, PR and contributions welcome! :)
- To protect the "Upload UI" cosider using something like https://github.com/espresso-lab/oidc-forward-auth-middleware
