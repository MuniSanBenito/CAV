/**
 * Datos de contribuyentes importados del sistema legacy de Rentas
 *
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "contribuyentes".
 */
export interface Contribuyente {
  id: string
  /**
   * Identificador único del contribuyente en el sistema legacy de Rentas (num_cont). Clave de deduplicación en la importación.
   */
  numero_contribuyente: number
  /**
   * Nombre o razón social del contribuyente (nom_cont).
   */
  nombre?: string | null
  /**
   * Domicilio fiscal o de contacto (dom_cont).
   */
  domicilio?: string | null
  /**
   * Código postal del domicilio (pos_cont).
   */
  codigo_postal?: number | null
  /**
   * Código AFIP del tipo de documento (tdo_cont). Ej.: 96 = DNI, 80 = CUIT, 89 = LE, 90 = LC.
   */
  tipo_documento?: number | null
  /**
   * Número de documento de identidad (ndo_cont).
   */
  numero_documento?: string | null
  /**
   * Categoría del contribuyente en Rentas (cat_cont). Valor numérico; en el export predominan categoría 1.
   */
  categoria?: number | null
  /**
   * CUIT/CUIL del contribuyente (cui_cont).
   */
  cuit?: string | null
  /**
   * Habilitación para trámites web (hwe_cont). En legacy: 1 = habilitado, 2 = no habilitado; importado como checkbox (solo 1 → true).
   */
  habilitado_web?: boolean | null
  /**
   * Clave de acceso web (cwe_cont). Suele venir como (Binary/Image) en el export y se importa vacío.
   */
  clave_web?: string | null
  /**
   * Email principal para trámites web (mwe_cont). Normalizado a minúsculas en la importación; muchos registros sin dato en el export.
   */
  email?: string | null
  /**
   * Campo numérico legacy de Rentas (dcc_cont), importado sin transformación.
   */
  dcc?: number | null
  /**
   * Altura o número de calle del domicilio (dca_cont).
   */
  domicilio_altura?: string | null
  /**
   * Entre calle o referencia secundaria (dcs_cont). Valores - se importan vacíos.
   */
  domicilio_calle_secundaria?: string | null
  /**
   * Torre o bloque del domicilio (dct_cont).
   */
  domicilio_torre?: string | null
  /**
   * Piso del domicilio (dcp_cont).
   */
  domicilio_piso?: string | null
  /**
   * Departamento o unidad (dcd_cont).
   */
  domicilio_depto?: string | null
  /**
   * Código de sexo (sex_cont). 1 = masculino, 2 = femenino, 0 = no informado.
   */
  sexo?: number | null
  /**
   * Nacionalidad declarada (nac_cont). Ej.: ARG.; valores (Binary/Image) se importan vacíos.
   */
  nacionalidad?: string | null
  /**
   * Campo numérico legacy (cba_cont). En el export actual todos los valores son 0.
   */
  cba?: number | null
  /**
   * CBU — Clave Bancaria Uniforme (cbu_cont), si fue informado.
   */
  cbu?: string | null
  /**
   * Fecha de alta en Rentas (fha_cont). La fecha sentinel 9999-12-31 se importa vacía.
   */
  fecha_alta?: string | null
  /**
   * Fecha de nacimiento (fna_cont). La fecha sentinel 1900-01-01 se importa vacía.
   */
  fecha_nacimiento?: string | null
  /**
   * Email secundario para trámites web (m2w_cont). Normalizado a minúsculas en la importación.
   */
  email_secundario?: string | null
  /**
   * Teléfono principal para trámites web (twe_cont).
   */
  telefono_web?: string | null
  /**
   * Teléfono secundario (t2w_cont).
   */
  telefono_secundario?: string | null
  /**
   * Campo numérico legacy (dfi_cont). En el export actual todos los valores son 0.
   */
  dfi?: number | null
  updatedAt: string
  createdAt: string
}
