use serde::{Deserialize, Serialize};
use std::env;
use std::time::Duration;
// use aws_config::BehaviorVersion; // TODO: Remove if working
use aws_sdk_s3 as s3;
use s3::presigning::PresigningConfig;
use s3::Client;
use salvo::http::StatusCode;
use salvo::prelude::*;
use tokio::sync::OnceCell;

static CLIENT: OnceCell<Client> = OnceCell::const_new();
static BUCKET_NAME: OnceCell<String> = OnceCell::const_new();

fn get_env(key: &str, default: Option<&str>) -> String {
    env::var(key).unwrap_or_else(|_| default.unwrap_or("").to_owned())
}

// Initialize S3 slient
async fn init_client() -> Client {
    let config = aws_config::load_from_env().await;
    let s3_endpoint = get_env("S3_ENDPOINT", Some("")); // https://....

    // TODO: Remove if working
    // let config2 = aws_config::load_defaults(BehaviorVersion::latest()).await;

    if s3_endpoint.is_empty() {
        return aws_sdk_s3::Client::new(&config);
    }

    let local_config = aws_sdk_s3::config::Builder::from(&config)
        .endpoint_url(s3_endpoint)
        .build();

    return aws_sdk_s3::Client::from_conf(local_config);
}

#[derive(Deserialize)]
struct UploadRequest {
    file_name: String,
}

#[derive(Serialize, Debug)]
struct UploadResponse {
    upload_url: String,
    download_url: String,
}

// Generate presigned url
#[handler]
async fn upload_url_handler(req: &mut Request, res: &mut Response) {
    let upload_request = req.parse_json::<UploadRequest>().await;
    let file_name = upload_request.unwrap().file_name;

    let result_upload = CLIENT
        .get()
        .unwrap()
        .put_object()
        .bucket(BUCKET_NAME.get().unwrap())
        .key(file_name.clone())
        .presigned(
            PresigningConfig::expires_in(Duration::from_secs(100))
                .unwrap()
                .clone(),
        )
        .await;

    let result_download = CLIENT
        .get()
        .unwrap()
        .get_object()
        .bucket(BUCKET_NAME.get().unwrap())
        .key(file_name.clone())
        .presigned(PresigningConfig::expires_in(Duration::from_secs(100)).unwrap())
        .await;

    return res.render(Json({
        UploadResponse {
            upload_url: result_upload.unwrap().uri().to_string(),
            download_url: result_download.unwrap().uri().to_string(),
        }
    }));
}

#[handler]
async fn ok_handler(res: &mut Response) {
    res.status_code(StatusCode::OK).render(Text::Plain("OK"))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    CLIENT.get_or_init(init_client).await;
    // BUCKET_NAME.get_or_init(|| "hallo".to_string());

    let router = Router::new()
        .push(Router::with_path("status").get(ok_handler))
        .push(Router::with_path("upload-url").post(upload_url_handler));

    let acceptor = TcpListener::new("127.0.0.1:9000").bind().await;
    Server::new(acceptor).serve(router).await;
}
