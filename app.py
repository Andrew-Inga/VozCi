from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime, timedelta
from facade import ProcesadorLegislativoFacade


app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

base_datos_propuestas = {}
procesador_facade = ProcesadorLegislativoFacade()


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/propuestas', methods=['POST'])
def crear_propuesta():
    datos = request.json
    prop_id = str(len(base_datos_propuestas) + 1)
    
    fecha_actual = datetime.now()
    fecha_limite = fecha_actual + timedelta(days=90) # 90 días de plazo
    
    base_datos_propuestas[prop_id] = {
        "id": prop_id,
        "titulo": datos.get("titulo"),
        "categoria": datos.get("categoria", "General"),
        "motivos": datos.get("motivos"),
        "articulado": datos.get("articulado"),
        "firmas": 0,
        "estado": "Activa",
        "fecha_creacion": fecha_actual.isoformat(),
        "fecha_limite": fecha_limite.isoformat(),
        "comentarios": []
    }
    return jsonify({"mensaje": "Propuesta creada exitosamente", "propuesta": base_datos_propuestas[prop_id]}), 201

@app.route('/api/propuestas/<prop_id>/firmar', methods=['POST'])
def firmar_propuesta(prop_id):
    propuesta = base_datos_propuestas.get(prop_id)
    if not propuesta:
        return jsonify({"error": "Propuesta no encontrada"}), 404
        
    if propuesta['estado'] == 'Congelada':
        return jsonify({"error": "La propuesta ya está congelada y enviada"}), 403

    # Validar la foto de la firma
    if 'firma' not in request.files:
        return jsonify({"error": "Es obligatorio adjuntar la foto con la firma"}), 400
        
    archivo_firma = request.files['firma']
    if archivo_firma.filename == '':
        return jsonify({"error": "No seleccionaste ninguna foto válida"}), 400

    print(f"Foto/Firma recibida en el servidor: {archivo_firma.filename}")
    propuesta['firmas'] += 1

    # Umbral de firmas (cámbialo a 3 para probar el congelamiento rápido en tu PC)
    UMBRAL_FIRMAS = 25000 
    if propuesta['firmas'] >= UMBRAL_FIRMAS:
        propuesta = procesador_facade.congelar_y_enviar(propuesta)

    return jsonify({"mensaje": "Firma y foto registradas correctamente", "propuesta": propuesta}), 200

@app.route('/api/propuestas', methods=['GET'])
def obtener_propuestas():
    return jsonify(list(base_datos_propuestas.values())), 200

if __name__ == '__main__':
    # Se ejecuta en el puerto 5000 por defecto
    app.run(debug=True, port=5000)