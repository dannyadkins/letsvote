import hashlib
import uuid


def get_document_id(url):
    document_id = hashlib.sha256(url.encode('utf-8')).hexdigest()
    return document_id

def get_uuid():
    return str(uuid.uuid4())