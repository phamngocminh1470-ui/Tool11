import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 2. ĐĂNG NHẬP GOOGLE QUA SUPABASE (Ép chọn tài khoản)
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  return { data, error };
}

/**
 * 3. UPLOAD ẢNH MINH CHỨNG MOMO LÊN SUPABASE STORAGE
 * Bucket: payment_proofs
 */
export async function uploadPaymentProof(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `momo_proof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from("payment_proofs")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw error;
  }

  // Lấy đường dẫn public URL của ảnh vừa upload
  const { data: { publicUrl } } = supabase.storage
    .from("payment_proofs")
    .getPublicUrl(fileName);

  return publicUrl;
}
