import os
from supabase import create_client as supa_create_client, Client

def create_client() -> Client:
    """Crear cliente de Supabase para Python"""
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar configurados")
    
    return supa_create_client(url, key) 