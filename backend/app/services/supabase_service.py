import os
import uuid
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("studyos.storage")

def upload_file_to_storage(file_bytes: bytes, filename: str, mime_type: str) -> str:
    """
    Uploads a file to Supabase Storage.
    Falls back to saving to local file system if Supabase credentials are not set.
    """
    unique_filename = f"{uuid.uuid4()}_{filename}"
    
    # Check if Supabase keys are configured
    is_mock = "supabase" in settings.SUPABASE_URL or "anon-key" in settings.SUPABASE_KEY
    
    if is_mock:
        # Save to local storage folder
        local_path = os.path.join(settings.LOCAL_STORAGE_DIR, "documents", unique_filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        # Return a relative path for local serving
        return f"/api/static/documents/{unique_filename}"
        
    try:
        # Use httpx to make API request directly to Supabase Storage REST endpoint
        url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_BUCKET}/{unique_filename}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_KEY}",
            "Content-Type": mime_type
        }
        
        with httpx.Client() as client:
            response = client.post(url, headers=headers, content=file_bytes)
            if response.status_code == 200:
                # Return the public URL
                return f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{unique_filename}"
            else:
                logger.warning(f"Supabase upload failed: {response.text}. Saving locally.")
    except Exception as e:
        logger.error(f"Error during Supabase upload: {str(e)}")

    # Fallback to local storage on error
    local_path = os.path.join(settings.LOCAL_STORAGE_DIR, "documents", unique_filename)
    with open(local_path, "wb") as f:
        f.write(file_bytes)
    return f"/api/static/documents/{unique_filename}"

def delete_file_from_storage(file_url: str):
    """
    Deletes file from Supabase storage or local folder.
    """
    if not file_url:
        return
        
    # Case 1: Local file fallback
    if file_url.startswith("/api/static/"):
        # Local file path format: /api/static/documents/{filename}
        filename = file_url.split("/")[-1]
        local_path = os.path.join(settings.LOCAL_STORAGE_DIR, "documents", filename)
        try:
            if os.path.exists(local_path):
                os.remove(local_path)
                logger.info(f"Deleted local file: {local_path}")
        except Exception as e:
            logger.error(f"Error deleting local file {local_path}: {str(e)}")
            
    # Case 2: Supabase file
    else:
        try:
            # Extract unique filename from url
            # Format: https://.../storage/v1/object/public/bucket/filename
            filename = file_url.split("/")[-1]
            url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_BUCKET}/{filename}"
            headers = {
                "Authorization": f"Bearer {settings.SUPABASE_KEY}"
            }
            with httpx.Client() as client:
                response = client.delete(url, headers=headers)
                if response.status_code == 200:
                    logger.info(f"Deleted Supabase file: {filename}")
                else:
                    logger.warning(f"Failed to delete Supabase file {filename}: {response.text}")
        except Exception as e:
            logger.error(f"Error deleting Supabase file: {str(e)}")

