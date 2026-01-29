import pytest

from app.services.yandex_gpt_client import YandexGPTError, YandexGPTClient


def test_yagpt_requires_credentials():
    with pytest.raises(YandexGPTError):
        YandexGPTClient(api_key=None, folder_id=None)
