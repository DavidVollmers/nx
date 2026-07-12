<% if (framework === 'fastapi') { -%>
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_hello():
    response = client.get('/hello')
    assert response.status_code == 200
    assert response.json() == {'message': 'Hello, <%= name %>!'}
<% } else { -%>
from main import main


def test_main(capsys):
    main()
    captured = capsys.readouterr()
    assert captured.out == 'Hello, <%= name %>!\n'
<% } -%>
