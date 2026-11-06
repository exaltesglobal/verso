//! Voice and translation model packs. Never in git: downloaded once from pinned
//! URLs (fixed commits), verified with SHA-256, kept in `<app data>/models/voice/<pack>/`.
//! See docs/AI-MODELS.md ("Voice and translation") for licences and attribution.

use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use serde::Serialize;
use sha2::{Digest, Sha256};

pub struct FileSpec {
    pub name: &'static str,
    pub url: &'static str,
    pub sha256: &'static str,
    pub size: u64,
}

pub struct PackSpec {
    pub id: &'static str,
    pub name: &'static str,
    pub purpose: &'static str,
    pub licence: &'static str,
    pub files: &'static [FileSpec],
}

pub const VOICE: &str = "voice";
pub const EN_INDIC: &str = "mt_en_indic";
pub const INDIC_EN: &str = "mt_indic_en";

macro_rules! file {
    ($name:literal, $base:expr, $path:literal, $sha:literal, $size:literal) => {
        FileSpec {
            name: $name,
            url: concat!($base, "/", $path),
            sha256: $sha,
            size: $size,
        }
    };
}

// URLs are pinned to fixed commits. `concat!` needs literals, hence the repetition.
pub const PACKS: &[PackSpec] = &[
    PackSpec {
        id: VOICE,
        name: "Voices",
        purpose: "Speaks English and Hindi (Kokoro-82M)",
        licence: "Apache-2.0",
        files: &[
            file!(
                "kokoro_q8.onnx",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "onnx/model_quantized.onnx",
                "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478",
                92361116
            ),
            file!(
                "us_gold.json",
                "https://raw.githubusercontent.com/hexgrad/misaki/fba1236595f2d2bf21d414ba6e57d25256afada3/misaki/data",
                "us_gold.json",
                "dc414872a49a28ae6c141463d502fd945f3b2fde040484fdc47d00cc4612686f",
                3000469
            ),
            file!(
                "us_silver.json",
                "https://raw.githubusercontent.com/hexgrad/misaki/fba1236595f2d2bf21d414ba6e57d25256afada3/misaki/data",
                "us_silver.json",
                "de8f67be911bb6c659187b4a65fd966b6a30e56350e0f790d763210b053ac475",
                3099517
            ),
            file!(
                "af_heart.bin",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "voices/af_heart.bin",
                "d583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b",
                522240
            ),
            file!(
                "am_michael.bin",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "voices/am_michael.bin",
                "1d1f21dd8da39c30705cd4c75d039d265e9bc4a2a93ed09bc9e1b1225eb95ba1",
                522240
            ),
            file!(
                "bf_emma.bin",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "voices/bf_emma.bin",
                "669fe0647f9dd04fcab92f1439a40eeb4c8b4ab1f82e4996fe3d918ce4a63b73",
                522240
            ),
            file!(
                "bm_george.bin",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "voices/bm_george.bin",
                "c4b235a4c1f2cd3b939fed08b899ce9385638b763f7b73a59616c4fc9bd6c9bc",
                522240
            ),
            file!(
                "hf_alpha.bin",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "voices/hf_alpha.bin",
                "040be6a4425411cc01fda5fd06693c76bfa78572632852bc8cda9c99232ffb56",
                522240
            ),
            file!(
                "hf_beta.bin",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "voices/hf_beta.bin",
                "cd83ae0bb9b2e4e4fb92b4973bd8d1822ca0036d3c498bf4fc89aa8e33917cc7",
                522240
            ),
            file!(
                "hm_omega.bin",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "voices/hm_omega.bin",
                "b02d9222d9ed00ce26b302173a862c2c93f96cc40b5c422b8d14910b9ff34137",
                522240
            ),
            file!(
                "hm_psi.bin",
                "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231",
                "voices/hm_psi.bin",
                "644daf88ba8aeb7bd08950bbdcd4453bb280864e49dc4df93fabc6be32e03f37",
                522240
            ),
        ],
    },
    PackSpec {
        id: EN_INDIC,
        name: "Translate from English",
        purpose: "English to Hindi, Marathi and other Indian languages (IndicTrans2)",
        licence: "MIT",
        files: &[
            file!(
                "encoder_model.onnx",
                "https://huggingface.co/hari31416/indictrans2-en-indic-dist-200M-ONNX-int8/resolve/1eaa43a3fb76f382f1b22c76e56f6ab4926ad68b",
                "encoder_model.onnx",
                "87c3d6c6fbc48d9d7081927f3bd59915d5443a06cb63460e0d3705bae74de5a9",
                831399
            ),
            file!(
                "encoder_model.onnx.data",
                "https://huggingface.co/hari31416/indictrans2-en-indic-dist-200M-ONNX-int8/resolve/1eaa43a3fb76f382f1b22c76e56f6ab4926ad68b",
                "encoder_model.onnx.data",
                "71a4d119514411a3cb3f9d76d2d88d5c4eac7c8e907397d62d5b29e2468a0c16",
                73791488
            ),
            file!(
                "decoder_model.onnx",
                "https://huggingface.co/hari31416/indictrans2-en-indic-dist-200M-ONNX-int8/resolve/1eaa43a3fb76f382f1b22c76e56f6ab4926ad68b",
                "decoder_model.onnx",
                "58c0fafb7ba0f343acba8643a386fab08143d49ef24472cefaecc87080f44e75",
                2037502
            ),
            file!(
                "decoder_shared.onnx.data",
                "https://huggingface.co/hari31416/indictrans2-en-indic-dist-200M-ONNX-int8/resolve/1eaa43a3fb76f382f1b22c76e56f6ab4926ad68b",
                "decoder_shared.onnx.data",
                "902314746ac629ae2ff584709c03eecdb0b3f7be4fb70ce0ff1bfbe66f14e574",
                203048944
            ),
            file!(
                "tokenizer_src.json",
                "https://huggingface.co/hari31416/indictrans2-en-indic-dist-200M-ONNX-int8/resolve/1eaa43a3fb76f382f1b22c76e56f6ab4926ad68b",
                "tokenizer_src.json",
                "ac1930c411028ba3a7929f35bc7f62d2e5e837ca24150b661de4f4606469eeca",
                3906621
            ),
            file!(
                "tokenizer_tgt.json",
                "https://huggingface.co/hari31416/indictrans2-en-indic-dist-200M-ONNX-int8/resolve/1eaa43a3fb76f382f1b22c76e56f6ab4926ad68b",
                "tokenizer_tgt.json",
                "51b05cd37636765e158146534d54452be558df32c6ab06ba4caeecdd0266a580",
                23869629
            ),
        ],
    },
    PackSpec {
        id: INDIC_EN,
        name: "Translate to English",
        purpose: "Hindi, Marathi and Hinglish to English (IndicTrans2)",
        licence: "MIT",
        files: &[
            file!(
                "encoder_model.onnx",
                "https://huggingface.co/hari31416/indictrans2-indic-en-dist-200M-ONNX-int8/resolve/a7ecdc0ba73148c6e1d051ca372332471d8aff4f",
                "encoder_model.onnx",
                "79dd1c3d9f90f8bbd48effcc2d150616ac3a97525c8081481f14cd5095567ca6",
                831436
            ),
            file!(
                "encoder_model.onnx.data",
                "https://huggingface.co/hari31416/indictrans2-indic-en-dist-200M-ONNX-int8/resolve/a7ecdc0ba73148c6e1d051ca372332471d8aff4f",
                "encoder_model.onnx.data",
                "6c402df00dfc45a69607e0231e1e5fd884508b19ca664836c94dd61bfa1ba137",
                120068096
            ),
            file!(
                "decoder_model.onnx",
                "https://huggingface.co/hari31416/indictrans2-indic-en-dist-200M-ONNX-int8/resolve/a7ecdc0ba73148c6e1d051ca372332471d8aff4f",
                "decoder_model.onnx",
                "845cdbaf0ee97d3c8ddff249a2e2d6e475d7ae1781157fcc6d0d651405bb8dd6",
                1585382
            ),
            file!(
                "decoder_shared.onnx.data",
                "https://huggingface.co/hari31416/indictrans2-indic-en-dist-200M-ONNX-int8/resolve/a7ecdc0ba73148c6e1d051ca372332471d8aff4f",
                "decoder_shared.onnx.data",
                "abe939ce4d60bcbb9744790640188686c8af084083eb50d63bdbb7266a325d9a",
                110052040
            ),
            file!(
                "tokenizer_src.json",
                "https://huggingface.co/hari31416/indictrans2-indic-en-dist-200M-ONNX-int8/resolve/a7ecdc0ba73148c6e1d051ca372332471d8aff4f",
                "tokenizer_src.json",
                "d15ba1265a61b3b66122aab74e888442093a2c711f51b0f9896108661e1d346c",
                23876630
            ),
            file!(
                "tokenizer_tgt.json",
                "https://huggingface.co/hari31416/indictrans2-indic-en-dist-200M-ONNX-int8/resolve/a7ecdc0ba73148c6e1d051ca372332471d8aff4f",
                "tokenizer_tgt.json",
                "053e948b03403ad9adc43a08e7e5c5d83854fffeddf1aae85e3ca82258698575",
                3899748
            ),
        ],
    },
];

/// A Kokoro voice. `lang` is the language it was trained on; every voice can read
/// both scripts (Hindi voices reading English give an Indian accent).
pub struct VoiceSpec {
    pub id: &'static str,
    pub name: &'static str,
    pub lang: &'static str,
    pub accent: &'static str,
    pub gender: &'static str,
}

pub const VOICES: &[VoiceSpec] = &[
    VoiceSpec {
        id: "hf_alpha",
        name: "Alpha",
        lang: "hi",
        accent: "Hindi",
        gender: "female",
    },
    VoiceSpec {
        id: "hm_omega",
        name: "Omega",
        lang: "hi",
        accent: "Hindi",
        gender: "male",
    },
    VoiceSpec {
        id: "hf_beta",
        name: "Beta",
        lang: "hi",
        accent: "Hindi",
        gender: "female",
    },
    VoiceSpec {
        id: "hm_psi",
        name: "Psi",
        lang: "hi",
        accent: "Hindi",
        gender: "male",
    },
    VoiceSpec {
        id: "af_heart",
        name: "Heart",
        lang: "en",
        accent: "American",
        gender: "female",
    },
    VoiceSpec {
        id: "am_michael",
        name: "Michael",
        lang: "en",
        accent: "American",
        gender: "male",
    },
    VoiceSpec {
        id: "bf_emma",
        name: "Emma",
        lang: "en",
        accent: "British",
        gender: "female",
    },
    VoiceSpec {
        id: "bm_george",
        name: "George",
        lang: "en",
        accent: "British",
        gender: "male",
    },
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PackStatus {
    pub id: String,
    pub name: String,
    pub purpose: String,
    pub size_bytes: u64,
    pub licence: String,
    pub installed: bool,
}

pub fn spec(id: &str) -> Result<&'static PackSpec, String> {
    PACKS
        .iter()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("We don't know the model \"{id}\"."))
}

pub fn voice(id: &str) -> Result<&'static VoiceSpec, String> {
    VOICES
        .iter()
        .find(|v| v.id == id)
        .ok_or_else(|| format!("We don't know the voice \"{id}\"."))
}

/// Folder of an installed pack, if every file is present.
pub fn installed(root: &Path, id: &str) -> Option<PathBuf> {
    let p = spec(id).ok()?;
    let dir = root.join(p.id);
    p.files
        .iter()
        .all(|f| dir.join(f.name).is_file())
        .then_some(dir)
}

pub fn require(root: &Path, id: &str) -> Result<PathBuf, String> {
    installed(root, id).ok_or_else(|| {
        let name = spec(id).map(|p| p.name).unwrap_or("model");
        format!("Download \"{name}\" first. It works offline after that.")
    })
}

pub fn status(root: &Path) -> Vec<PackStatus> {
    PACKS
        .iter()
        .map(|p| PackStatus {
            id: p.id.into(),
            name: p.name.into(),
            purpose: p.purpose.into(),
            size_bytes: p.files.iter().map(|f| f.size).sum(),
            licence: p.licence.into(),
            installed: installed(root, p.id).is_some(),
        })
        .collect()
}

/// Download, verify and install every missing file of a pack. `progress` gets 0..=100.
pub fn download(root: &Path, id: &str, mut progress: impl FnMut(f64)) -> Result<PathBuf, String> {
    let p = spec(id)?;
    let dir = root.join(p.id);
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("We couldn't create the models folder ({e})."))?;
    let total: u64 = p.files.iter().map(|f| f.size).sum();
    let mut done: u64 = 0;
    let mut last_pct = -1.0;
    for f in p.files {
        let dest = dir.join(f.name);
        if dest.is_file() {
            done += f.size;
            continue;
        }
        let part = dir.join(format!("{}.part", f.name));
        let resp = ureq::get(&crate::reframe::models::mirrored(f.url))
            .call()
            .map_err(|e| {
                format!(
                    "We couldn't download {} ({e}). Check your internet connection and try again.",
                    p.name
                )
            })?;
        let mut body = resp.into_body();
        let mut reader = body.as_reader();
        let mut file = std::fs::File::create(&part)
            .map_err(|e| format!("We couldn't save the model ({e})."))?;
        let mut hasher = Sha256::new();
        let mut buf = vec![0u8; 64 * 1024];
        loop {
            let n = reader
                .read(&mut buf)
                .map_err(|e| format!("The download stopped ({e}). Please try again."))?;
            if n == 0 {
                break;
            }
            hasher.update(&buf[..n]);
            file.write_all(&buf[..n])
                .map_err(|e| format!("We couldn't save the model ({e})."))?;
            done += n as u64;
            let pct = (done as f64 / total as f64 * 100.0).min(100.0).floor();
            if pct > last_pct {
                last_pct = pct;
                progress(pct);
            }
        }
        drop(file);
        if format!("{:x}", hasher.finalize()) != f.sha256 {
            let _ = std::fs::remove_file(&part);
            return Err(format!(
                "What we downloaded for {} doesn't match what we expected, so we didn't use it. Please try again.",
                p.name
            ));
        }
        std::fs::rename(&part, &dest)
            .map_err(|e| format!("We couldn't install the model ({e})."))?;
    }
    progress(100.0);
    Ok(dir)
}
