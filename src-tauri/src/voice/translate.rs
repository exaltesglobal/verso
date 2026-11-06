//! IndicTrans2 distilled 200M (MIT, AI4Bharat) through ONNX Runtime.
//! Greedy decoding; tokenization with the `tokenizers` crate (Apache-2.0).

use std::path::Path;

use ort::session::Session;
use ort::value::Tensor;
use tokenizers::Tokenizer;

/// Ids beyond the model's own dictionaries map to <unk> (tokenizer_meta.json).
const UNK: u32 = 3;
const EOS: i64 = 2;
const DECODER_START: i64 = 2;
const SMALL_DICT: u32 = 32_322;
const LARGE_DICT: u32 = 122_672;

pub struct Translator {
    encoder: Session,
    decoder: Session,
    src: Tokenizer,
    tgt: Tokenizer,
    src_dict: u32,
    tgt_dict: u32,
}

/// IndicTrans2 language tag for our language ids.
pub fn tag(lang: &str) -> Result<&'static str, String> {
    Ok(match lang {
        "en" => "eng_Latn",
        "hi" | "hinglish" => "hin_Deva",
        "mr" => "mar_Deva",
        _ => return Err(format!("We can't translate \"{lang}\" yet.")),
    })
}

impl Translator {
    /// `to_english`: the indic-en pack (big source dictionary) instead of en-indic.
    pub fn new(dir: &Path, to_english: bool) -> Result<Self, String> {
        let tok = |name: &str| {
            Tokenizer::from_file(dir.join(name))
                .map_err(|e| format!("We couldn't read the translator's word list ({e}). Try downloading it again."))
        };
        let (src_dict, tgt_dict) = if to_english { (LARGE_DICT, SMALL_DICT) } else { (SMALL_DICT, LARGE_DICT) };
        Ok(Self {
            encoder: crate::reframe::onnx::load(&dir.join("encoder_model.onnx"))?,
            decoder: crate::reframe::onnx::load(&dir.join("decoder_model.onnx"))?,
            src: tok("tokenizer_src.json")?,
            tgt: tok("tokenizer_tgt.json")?,
            src_dict,
            tgt_dict,
        })
    }

    pub fn translate(&mut self, text: &str, from: &str, to: &str) -> Result<String, String> {
        let text = text.trim();
        if text.is_empty() {
            return Ok(String::new());
        }
        let run_err = |e: ort::Error| format!("The translator stopped unexpectedly ({e}).");
        let enc = self
            .src
            .encode(format!("{} {} {text}", tag(from)?, tag(to)?), true)
            .map_err(|e| format!("We couldn't read that text ({e})."))?;
        let ids: Vec<i64> = enc
            .get_ids()
            .iter()
            .map(|&i| i64::from(if i < self.src_dict { i } else { UNK }))
            .collect();
        let n = ids.len();
        let mask = vec![1i64; n];
        let out = self
            .encoder
            .run(ort::inputs![
                "input_ids" => Tensor::from_array(([1usize, n], ids)).map_err(run_err)?,
                "attention_mask" => Tensor::from_array(([1usize, n], mask.clone())).map_err(run_err)?
            ])
            .map_err(run_err)?;
        let (shape, hidden) = out["last_hidden_state"].try_extract_tensor::<f32>().map_err(run_err)?;
        let dim = shape[2] as usize;
        let hidden = hidden.to_vec();
        drop(out);

        // shortcut: no KV cache (decoder_with_past) - each step re-reads the whole
        // prefix. Fine for caption-length lines; add the cached decoder for long text.
        let mut out_ids = vec![DECODER_START];
        let max_len = (n * 3).clamp(16, 256);
        while out_ids.len() < max_len {
            let t = out_ids.len();
            let logits = self
                .decoder
                .run(ort::inputs![
                    "input_ids" => Tensor::from_array(([1usize, t], out_ids.clone())).map_err(run_err)?,
                    "encoder_hidden_states" => Tensor::from_array(([1usize, n, dim], hidden.clone())).map_err(run_err)?,
                    "encoder_attention_mask" => Tensor::from_array(([1usize, n], mask.clone())).map_err(run_err)?
                ])
                .map_err(run_err)?;
            let (shape, data) = logits[0].try_extract_tensor::<f32>().map_err(run_err)?;
            let vocab = shape[2] as usize;
            let last = &data[(t - 1) * vocab..t * vocab];
            let next = last
                .iter()
                .enumerate()
                .max_by(|a, b| a.1.total_cmp(b.1))
                .map(|(i, _)| i as i64)
                .unwrap_or(EOS);
            if next == EOS {
                break;
            }
            out_ids.push(next);
        }
        let ids: Vec<u32> = out_ids[1..]
            .iter()
            .map(|&i| if (i as u32) < self.tgt_dict { i as u32 } else { UNK })
            .collect();
        let s = self
            .tgt
            .decode(&ids, true)
            .map_err(|e| format!("We couldn't write the translation ({e})."))?;
        Ok(s.trim().to_string())
    }
}
