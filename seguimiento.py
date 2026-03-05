import urllib.request, csv, json, io
from datetime import datetime, timedelta

def to_f(val):
    if val is None or str(val).strip() == "":
        return 0.0
    try:
        # Limpieza profunda de caracteres no numéricos excepto el punto decimal
        return float(str(val).replace(',', '').strip())
    except:
        return 0.0

def generate_seguimiento_detallado():
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Gasto-Diario.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    CODIGO_PLIEGO_LAMBAYEQUE = "452"
    
    try:
        print(f"🚀 Procesando Gasto Diario...")
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=600) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            
            # --- TRUCO MAESTRO: Normalizar todos los nombres de columnas ---
            # Esto convierte ' MONTO_PIA ' en 'MONTO_PIA' automáticamente
            reader.fieldnames = [f.strip().upper() for f in reader.fieldnames]
            
            proyectos_data = []

            for r in reader:
                # Normalizamos los datos de la fila actual para que coincidan con las llaves limpias
                row = {k.strip().upper(): v for k, v in r.items()}
                
                if row.get('PLIEGO') == CODIGO_PLIEGO_LAMBAYEQUE:
                    # FORZAMOS la creación de la llave en el diccionario final
                    data_row = {
                        "PRODUCTO_PROYECTO": row.get('PRODUCTO_PROYECTO', ''),
                        "PRODUCTO_PROYECTO_NOMBRE": row.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                        "EJECUTORA_NOMBRE": row.get('EJECUTORA_NOMBRE', 'SIN NOMBRE'),
                        "ANO_EJE": row.get('ANO_EJE', '2026'),
                        
                        # Aquí forzamos la lectura. Si el campo existe en el CSV, to_f lo captura.
                        # Si es 0 o está vacío, to_f devuelve 0.0, pero LA LLAVE SE CREA.
                        "MONTO_PIA": to_f(row.get('MONTO_PIA')),
                        "MONTO_PIM": to_f(row.get('MONTO_PIM')),
                        "MONTO_CERTIFICADO": to_f(row.get('MONTO_CERTIFICADO')),
                        "MONTO_DEVENGADO": to_f(row.get('MONTO_DEVENGADO')),
                        "MONTO_GIRADO": to_f(row.get('MONTO_GIRADO')),
                        
                        "TIPO_ACT_PROY_NOMBRE": row.get('TIPO_ACT_PROY_NOMBRE', '')
                    }
                    proyectos_data.append(data_row)

            # Guardar el JSON
            with open('data_gasto_lambayeque.json', 'w', encoding='utf-8') as f:
                json.dump({"proyectos": proyectos_data}, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! El campo MONTO_PIA ha sido forzado en {len(proyectos_data)} registros.")

    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    generate_seguimiento_detallado()
