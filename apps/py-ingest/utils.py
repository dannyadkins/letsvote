import hashlib


def get_document_id(url):
    document_id = hashlib.sha256(url.encode('utf-8')).hexdigest()
    return document_id