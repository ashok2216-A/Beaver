import pytest
from utils.security import encrypt_secret, decrypt_secret
import os

def test_encryption_decryption():
    """Test that secrets are correctly encrypted and decrypted with AES-256."""
    original_secret = "sk-test-123456789"
    encrypted = encrypt_secret(original_secret)
    
    assert encrypted != original_secret
    assert len(encrypted) > len(original_secret)
    
    decrypted = decrypt_secret(encrypted)
    assert decrypted == original_secret

def test_decryption_fallback():
    """Test that decryption returns the original text if it's not encrypted (fallback)."""
    plain_text = "not_encrypted_yet"
    decrypted = decrypt_secret(plain_text)
    assert decrypted == plain_text

def test_empty_handling():
    """Test that empty strings are handled gracefully."""
    assert encrypt_secret("") == ""
    assert decrypt_secret("") == ""
    assert decrypt_secret(None) == ""
