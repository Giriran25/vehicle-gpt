import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope='module')
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_health_and_seed_data(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'
    assert response.json()['database'] == 'connected'
    assert response.json()['telemetry_records'] >= 1

def test_summary_has_metrics(client):
    response = client.get('/api/summary?vehicle_id=demo-vehicle-01')
    assert response.status_code == 200
    body = response.json()
    assert body['total_records'] >= 1
    assert 'max_engine_temp_c' in body['metrics']

def test_question_returns_grounded_answer(client):
    response = client.post('/api/ask', json={'question': 'What is the engine temperature?', 'vehicle_id': 'demo-vehicle-01'})
    assert response.status_code == 200
    body = response.json()
    assert body['answer']
    assert body['evidence']
    assert body['query_id']

def test_question_validation(client):
    response = client.post('/api/ask', json={'question': 'x', 'vehicle_id': 'demo-vehicle-01'})
    assert response.status_code == 422

def test_telemetry_validation_rejects_impossible_values(client):
    response = client.post('/api/telemetry', json={'vehicle_id': 'test-car', 'event_type': 'test', 'speed_kph': 900})
    assert response.status_code == 422


def test_assistant_and_speech_assets(client):
    llm_res = client.get('/llm')
    assert llm_res.status_code == 200
    assert 'data-page="llm"' in llm_res.text

    js_res = client.get('/static/app.js')
    assert js_res.status_code == 200
    assert 'initVoiceAssistant' in js_res.text
    assert 'voiceToggle' in js_res.text
    assert 'voicePlayBtn' in js_res.text
    assert 'micButton' in js_res.text

    css_res = client.get('/static/styles.css')
    assert css_res.status_code == 200
    assert '.voice-toolbar' in css_res.text
    assert '.mic-button' in css_res.text

