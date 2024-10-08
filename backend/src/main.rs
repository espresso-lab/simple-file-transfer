use actix_cors::Cors;
use actix_files as fs;
use actix_web::{get, middleware::Logger, post, web, App, HttpResponse, HttpServer, Responder};
use aws_config::{BehaviorVersion, SdkConfig};
use aws_sdk_s3 as s3;
use env_logger::Env;
use s3::{presigning::PresigningConfig, Client};
use serde::{Deserialize, Serialize};
use std::env;
use std::time::Duration;
use uuid::Uuid;
use validator::Validate;

struct AppState {
    s3_client: Client,
}

// Initialize S3 slient
fn init_client(config: &SdkConfig) -> Client {
    let s3_endpoint = env::var("S3_ENDPOINT").unwrap_or("".to_string());

    if s3_endpoint.is_empty() {
        return aws_sdk_s3::Client::new(&config);
    }

    let local_config = aws_sdk_s3::config::Builder::from(config)
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

#[post("/upload-url")]
async fn upload_url_handler(
    req: web::Json<UploadRequest>,
    data: web::Data<AppState>,
) -> impl Responder {
    let upload_request = req.into_inner();

    if let Err(errors) = upload_request.validate() {
        return HttpResponse::BadRequest().body(errors.to_string());
    }

    let file_name = format!("{}/{}", Uuid::new_v4(), upload_request.file_name);
    let expires_in_secs = upload_request.expires_in_secs.unwrap_or(86400 * 7);
    let bucket_name = env::var("S3_BUCKET_NAME").expect("Env 'S3_BUCKET_NAME' is empty.");

    let result_upload = data
        .s3_client
        .put_object()
        .bucket(&bucket_name)
        .key(file_name.clone())
        .presigned(
            PresigningConfig::expires_in(Duration::from_secs(600))
                .unwrap()
                .clone(),
        )
        .await;

    let result_download = data
        .s3_client
        .get_object()
        .bucket(&bucket_name)
        .key(file_name)
        .presigned(PresigningConfig::expires_in(Duration::from_secs(expires_in_secs)).unwrap())
        .await;

    HttpResponse::Ok().json(UploadResponse {
        upload_url: result_upload.unwrap().uri().to_string(),
        download_url: result_download.unwrap().uri().to_string(),
    })
}

#[get("/status")]
async fn ok() -> impl Responder {
    HttpResponse::Ok().body("Ok")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    HttpServer::new(move || {
        let allowed_origins = env::var("CORS_ALLOWED_ORIGINS").unwrap_or("*".to_string());
        let cors = Cors::default()
            .allowed_methods(vec!["OPTIONS", "GET", "POST"])
            .allow_any_header()
            .allowed_origin_fn(move |origin, _| {
                if allowed_origins == "*" {
                    return true;
                }
                let allowed_origins_list: Vec<&str> = allowed_origins
                    .split_terminator(",")
                    .filter(|s| !s.is_empty())
                    .collect();
                allowed_origins_list.contains(&origin.to_str().unwrap())
            });

        App::new()
            .app_data(web::Data::new(AppState {
                s3_client: init_client(&config),
            }))
            .wrap(Logger::default())
            .wrap(cors)
            .service(upload_url_handler)
            .service(ok)
            .service(fs::Files::new("/icon.svg", "static").index_file("icon.svg"))
            .service(
                fs::Files::new("/", "static")
                    .index_file("index.html")
                    .show_files_listing(),
            )
    })
    .bind("0.0.0.0:3000")?
    .run()
    .await
}
