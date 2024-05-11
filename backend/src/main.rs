use aws_config::BehaviorVersion;
use aws_sdk_s3 as s3;
use once_cell::sync::Lazy;
use s3::presigning::PresigningConfig;
use s3::Client;
use salvo::http::header;
use salvo::http::{HeaderValue, StatusCode};
use salvo::prelude::*;
use salvo::serve_static::StaticDir;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use std::{env, process};
use tokio::sync::OnceCell;
use tracing::error;
use validator::Validate;

static CORS_ALLOW_ORIGINS: Lazy<String> =
    Lazy::new(|| env::var("CORS_ALLOW_ORIGINS").unwrap_or("*".to_string()));
static CLIENT: OnceCell<Client> = OnceCell::const_new();
static BUCKET_NAME: Lazy<String> = Lazy::new(|| {
    let bucket_name = env::var("S3_BUCKET_NAME").unwrap_or("".to_string());

    if bucket_name.is_empty() {
        error!("Env 'S3_BUCKET_NAME' is empty.");
        process::exit(1);
    }

    bucket_name
});

// Initialize S3 slient
async fn init_client() -> Client {
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let s3_endpoint = env::var("S3_ENDPOINT").unwrap_or("".to_string());

    if s3_endpoint.is_empty() {
        return aws_sdk_s3::Client::new(&config);
    }

    let local_config = aws_sdk_s3::config::Builder::from(&config)
        .endpoint_url(s3_endpoint)
        .force_path_style(
            env::var("S3_FORCE_PATH_STYLE")
                .unwrap_or("".to_string())
                .eq("true"),
        )
        .build();

    return aws_sdk_s3::Client::from_conf(local_config);
}

#[derive(Deserialize, Debug, Validate)]
struct UploadRequest {
    #[validate(length(min = 3))]
    file_name: String,
    expires_in_secs: Option<u64>,
}

#[derive(Serialize, Debug)]
struct UploadResponse {
    upload_url: String,
    download_url: String,
}

// Generate presigned url
#[handler]
async fn upload_url_handler(req: &mut Request, res: &mut Response) {
    // TODO: Check if working
    let _ = req.add_header(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/json"),
        true,
    );

    let upload_request = req
        .parse_json::<UploadRequest>()
        .await
        .map_err(|_| {
            res.status_code(StatusCode::BAD_REQUEST)
                .render(Text::Plain("Invalid UploadRequest json."))
        })
        .unwrap();

    match upload_request.validate() {
        Ok(_) => {}
        Err(errors) => {
            return res
                .status_code(StatusCode::BAD_REQUEST)
                .render(Text::Plain(errors.to_string()));
        }
    };

    let file_name = upload_request.file_name;
    let expires_in_secs = upload_request.expires_in_secs.unwrap_or_else(|| 86400);
    let bucket_name = BUCKET_NAME.to_string();

    let my_client = CLIENT.get().unwrap();

    let result_upload = my_client
        .put_object()
        .bucket(&bucket_name)
        .key(file_name.clone())
        .presigned(
            PresigningConfig::expires_in(Duration::from_secs(600))
                .unwrap()
                .clone(),
        )
        .await;

    let result_download = my_client
        .get_object()
        .bucket(&bucket_name)
        .key(file_name.clone())
        .presigned(PresigningConfig::expires_in(Duration::from_secs(expires_in_secs)).unwrap())
        .await;

    return res.render(Json({
        UploadResponse {
            upload_url: result_upload.unwrap().uri().to_string(),
            download_url: result_download.unwrap().uri().to_string(),
        }
    }));
}

#[handler]
async fn content_type(_req: &mut Request, res: &mut Response) {
    res.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/json"),
    );
}

#[handler]
async fn cors(_req: &mut Request, res: &mut Response) {
    res.headers_mut().insert(
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        HeaderValue::from_static(CORS_ALLOW_ORIGINS.as_str()),
    );

    res.headers_mut().insert(
        header::ACCESS_CONTROL_ALLOW_HEADERS,
        HeaderValue::from_static("*"),
    );

    res.headers_mut().insert(
        header::ACCESS_CONTROL_ALLOW_METHODS,
        HeaderValue::from_static("*"),
    );
}

#[handler]
async fn ok(res: &mut Response) {
    res.status_code(StatusCode::OK).render(Text::Plain("OK"))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    CLIENT.get_or_init(init_client).await;

    let router = Router::new()
        .hoop(content_type)
        .hoop(cors)
        .push(Router::with_path("status").get(ok))
        .push(
            Router::with_path("upload-url")
                .post(upload_url_handler)
                .options(ok),
        )
        .push(Router::with_path("icon.svg").get(StaticFile::new("static/icon.svg")))
        .push(
            Router::with_path("<**path>").get(
                StaticDir::new(["static"])
                    .defaults("index.html")
                    .auto_list(true),
            ),
        );

    let acceptor = TcpListener::new("0.0.0.0:3000").bind().await;
    Server::new(acceptor).serve(router).await;
}
