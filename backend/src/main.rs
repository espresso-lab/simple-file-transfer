use actix_cors::Cors;
use actix_files as fs;
use actix_web::{get, middleware::Logger, post, web, App, HttpResponse, HttpServer, Responder};
use aws_config::SdkConfig;
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

fn init_client(config: &SdkConfig) -> Client {
    let s3_endpoint = env::var("S3_ENDPOINT").unwrap_or_default();
    if s3_endpoint.is_empty() {
        return Client::new(config);
    }
    let local_config = aws_sdk_s3::config::Builder::from(config)
        .endpoint_url(s3_endpoint)
        .force_path_style(env::var("S3_FORCE_PATH_STYLE").unwrap_or_default() == "true")
        .build();
    Client::from_conf(local_config)
}

#[derive(Deserialize, Debug, Validate)]
#[serde(rename_all = "camelCase")]
struct UploadRequest {
    #[validate(length(min = 3))]
    file_name: String,
    expires_in_secs: Option<u64>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct UploadResponse {
    upload_url: String,
    download_url: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct UploadReadyRequest {
    file_name: String,
    download_url: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct LinkShortenerRequest {
    slug: String,
    url: String,
    expires_in_secs: u64
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LinkWithSlugUrl {
    pub forwarder_url: String,
}

async fn generate_short_url(download_url: String, file_name: String, expires_in_secs: u64) -> Result<String, Error> {
    let link_shortener_endpoint = env::var("LINK_SHORTENER_ENDPOINT").unwrap_or_default();
    if link_shortener_endpoint.is_empty() {
        return Ok(download_url);
    }
    let slug = if env::var("LINK_SHORTENER_RANDOM_SLUG").unwrap_or_default().eq_ignore_ascii_case("true") {
        "".to_string()
    } else {
        file_name
    };
    let response = reqwest::Client::new()
        .post(&link_shortener_endpoint)
        .json(&LinkShortenerRequest { slug, url: download_url.clone() })
        .send()
        .await?;
    let link: LinkWithSlugUrl = response.json().await?;
    Ok(link.url_slug.unwrap_or(download_url))
}

#[post("/upload-url")]
async fn upload_url_handler(req: web::Json<UploadRequest>, data: web::Data<AppState>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let upload_request = req.into_inner();
    if let Err(errors) = upload_request.validate() {
        return Ok(HttpResponse::BadRequest().body(errors.to_string()));
    }
    let file_name = format!("{}/{}", Uuid::new_v4(), upload_request.file_name);
    let expires_in_secs = upload_request.expires_in_secs.unwrap_or(86400 * 7);
    let bucket_name = env::var("S3_BUCKET_NAME").expect("Env 'S3_BUCKET_NAME' is empty.");
    let result_upload = data.s3_client
        .put_object()
        .bucket(&bucket_name)
        .key(&file_name)
        .presigned(PresigningConfig::expires_in(Duration::from_secs(600))?)
        .await?;
    let mut download_url = data.s3_client
        .get_object()
        .bucket(&bucket_name)
        .key(&file_name)
        .presigned(PresigningConfig::expires_in(Duration::from_secs(expires_in_secs))?)
        .await?
        .uri()
        .to_string();
    if env::var("LINK_SHORTENER_ENDPOINT").is_ok() {
        if let Ok(val) = generate_short_url(download_url.clone(), file_name).await {
            download_url = val;
        }
    }
    Ok(HttpResponse::Ok().json(UploadResponse {
        upload_url: result_upload.uri().to_string(),
        download_url,
    }))
}

#[get("/status")]
async fn ok() -> impl Responder {
    HttpResponse::Ok().body("Ok")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = aws_config::load_from_env().await;
    env_logger::init_from_env(Env::default().default_filter_or("info"));
    HttpServer::new(move || {
        let allowed_origins = env::var("CORS_ALLOWED_ORIGINS").unwrap_or("*".to_string());
        let cors = Cors::default()
            .allowed_methods(vec!["OPTIONS", "GET", "POST"])
            .allow_any_header()
            .allowed_origin_fn(move |origin, _| {
                if allowed_origins == "*" {
                    true
                } else {
                    allowed_origins.split(',').any(|s| s == origin.to_str().unwrap())
                }
            });
        App::new()
            .app_data(web::Data::new(AppState { s3_client: init_client(&config) }))
            .wrap(Logger::default())
            .wrap(cors)
            .service(ok)
            .service(upload_url_handler)
            .service(fs::Files::new("/icon.svg", "static").index_file("icon.svg"))
            .service(fs::Files::new("/", "static").index_file("index.html").show_files_listing())
    })
        .bind("0.0.0.0:3000")?
        .run()
        .await
}