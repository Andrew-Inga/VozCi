import hashlib

class MotorCriptografico:
    def generar_hash_sha256(self, datos_expediente):
        return hashlib.sha256(datos_expediente.encode('utf-8')).hexdigest()

class IntegracionCongreso:
    def enviar_expediente(self, id_propuesta, hash_firma):
        print(f"[CONGRESO] Recibiendo expediente {id_propuesta} con firma: {hash_firma}")
        return True

class ProcesadorLegislativoFacade:
    def __init__(self):
        self.cripto = MotorCriptografico()
        self.congreso = IntegracionCongreso()

    def congelar_y_enviar(self, propuesta):
        print(f"--- Iniciando congelamiento: {propuesta['titulo']} ---")
        datos_crudos = f"{propuesta['titulo']}|{propuesta['motivos']}|{propuesta['articulado']}|{propuesta['firmas']}"
        hash_generado = self.cripto.generar_hash_sha256(datos_crudos)
        
        propuesta['estado'] = 'Congelada'
        propuesta['hash_criptografico'] = hash_generado
        self.congreso.enviar_expediente(propuesta['id'], hash_generado)
        
        return propuesta