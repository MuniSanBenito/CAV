export interface Contribuyente {
  id: string
  numero_contribuyente: number
  nombre?: string | null
  domicilio?: string | null
  codigo_postal?: number | null
  tipo_documento?: number | null
  numero_documento?: string | null
  categoria?: number | null
  cuit?: string | null
  habilitado_web?: boolean | null
  clave_web?: string | null
  email?: string | null
  dcc?: number | null
  domicilio_altura?: string | null
  domicilio_calle_secundaria?: string | null
  domicilio_torre?: string | null
  domicilio_piso?: string | null
  domicilio_depto?: string | null
  sexo?: number | null
  nacionalidad?: string | null
  cba?: number | null
  cbu?: string | null
  fecha_alta?: string | null
  fecha_nacimiento?: string | null
  email_secundario?: string | null
  telefono_web?: string | null
  telefono_secundario?: string | null
  dfi?: number | null
  updatedAt: string
  createdAt: string
}
