/**
 * Centralized cache tag definitions for on-demand revalidation.
 *
 * Convention:  `domain:entity`  or  `domain:entity:id`
 * Usage:       revalidateTag('control-academico:exams')
 */

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authTags = {
  session: () => 'auth:session' as const,
  user: (id: number | string) => `auth:user:${id}` as const,
} as const;

// ─── Admisiones ─────────────────────────────────────────────────────────────
export const admisionesTags = {
  preinscripciones: () => 'admisiones:preinscripciones' as const,
  preinscripcion: (id: number | string) => `admisiones:preinscripcion:${id}` as const,
  inscripciones: () => 'admisiones:inscripciones' as const,
  inscripcion: (id: number | string) => `admisiones:inscripcion:${id}` as const,
  entrevistas: () => 'admisiones:entrevistas' as const,
  entrevista: (id: number | string) => `admisiones:entrevista:${id}` as const,
  documentos: () => 'admisiones:documentos' as const,
  documento: (id: number | string) => `admisiones:documento:${id}` as const,
  matriculas: () => 'admisiones:matriculas' as const,
  matricula: (id: number | string) => `admisiones:matricula:${id}` as const,
} as const;

// ─── Control Académico ──────────────────────────────────────────────────────
export const controlAcademicoTags = {
  exams: () => 'control-academico:exams' as const,
  exam: (id: number | string) => `control-academico:exam:${id}` as const,
  examGroups: () => 'control-academico:exam-groups' as const,
  examGroup: (id: number | string) => `control-academico:exam-group:${id}` as const,
  examAssignments: () => 'control-academico:exam-assignments' as const,
  examAssignment: (id: number | string) => `control-academico:exam-assignment:${id}` as const,
  questions: () => 'control-academico:questions' as const,
  question: (id: number | string) => `control-academico:question:${id}` as const,
  themes: () => 'control-academico:themes' as const,
  theme: (id: number | string) => `control-academico:theme:${id}` as const,
  criteria: () => 'control-academico:criteria' as const,
  criterion: (id: number | string) => `control-academico:criterion:${id}` as const,
  classes: () => 'control-academico:classes' as const,
  class: (id: number | string) => `control-academico:class:${id}` as const,
  classTypes: () => 'control-academico:class-types' as const,
  classType: (id: number | string) => `control-academico:class-type:${id}` as const,
  activities: () => 'control-academico:activities' as const,
  activity: (id: number | string) => `control-academico:activity:${id}` as const,
  activityTypes: () => 'control-academico:activity-types' as const,
  learningSequences: () => 'control-academico:learning-sequences' as const,
  learningSequence: (id: number | string) => `control-academico:learning-sequence:${id}` as const,
  learningAssignments: () => 'control-academico:learning-assignments' as const,
  learningAssignment: (id: number | string) => `control-academico:learning-assignment:${id}` as const,
  feedbackForms: () => 'control-academico:feedback-forms' as const,
  feedbackForm: (id: number | string) => `control-academico:feedback-form:${id}` as const,
  feedbackCatalogs: () => 'control-academico:feedback-catalogs' as const,
  feedbackAssignments: () => 'control-academico:feedback-assignments' as const,
  examAttempts: (examId: number | string, studentId: number | string) =>
    `control-academico:exam:${examId}:attempts:${studentId}` as const,
  examAttempt: (attemptId: number | string) =>
    `control-academico:exam-attempt:${attemptId}` as const,
  observations: (examId: number | string, studentId: number | string) =>
    `control-academico:exam:${examId}:observations:${studentId}` as const,
} as const;

// ─── Estructura Institución ─────────────────────────────────────────────────
export const estructuraTags = {
  campuses: () => 'estructura:campuses' as const,
  campus: (id: number | string) => `estructura:campus:${id}` as const,
  classrooms: () => 'estructura:classrooms' as const,
  classroom: (id: number | string) => `estructura:classroom:${id}` as const,
  grades: () => 'estructura:grades' as const,
  grade: (id: number | string) => `estructura:grade:${id}` as const,
  groups: () => 'estructura:groups' as const,
  group: (id: number | string) => `estructura:group:${id}` as const,
  groupStudents: () => 'estructura:group-students' as const,
  groupStudent: (id: number | string) => `estructura:group-student:${id}` as const,
  nivelesEducativos: () => 'estructura:niveles-educativos' as const,
  nivelEducativo: (id: number | string) => `estructura:nivel-educativo:${id}` as const,
  sedes: () => 'estructura:sedes' as const,
  sede: (id: number | string) => `estructura:sede:${id}` as const,
  salones: () => 'estructura:salones' as const,
  salon: (id: number | string) => `estructura:salon:${id}` as const,
  aulas: () => 'estructura:aulas' as const,
  aula: (id: number | string) => `estructura:aula:${id}` as const,
} as const;

// ─── Gestión Alumnos ────────────────────────────────────────────────────────
export const gestionAlumnosTags = {
  students: () => 'alumnos:students' as const,
  student: (id: number | string) => `alumnos:student:${id}` as const,
  guardians: () => 'alumnos:guardians' as const,
  guardian: (id: number | string) => `alumnos:guardian:${id}` as const,
  relationships: () => 'alumnos:relationships' as const,
  relationship: (id: number | string) => `alumnos:relationship:${id}` as const,
  parentescos: () => 'alumnos:parentescos' as const,
  parentesco: (id: number | string) => `alumnos:parentesco:${id}` as const,
} as const;

// ─── Usuarios del instituto ─────────────────────────────────────────────────
export const usuariosTags = {
  profesores: () => 'usuarios:profesores' as const,
  profesor: (id: number | string) => `usuarios:profesor:${id}` as const,
} as const;

// ─── Parametros ─────────────────────────────────────────────────────────────
export const parametrosTags = {
  documentTypes: () => 'parametros:document-types' as const,
  documentType: (id: number | string) => `parametros:document-type:${id}` as const,
  geoCountries: () => 'parametros:geo:countries' as const,
  geoStates: (countryId: number | string) => `parametros:geo:states:${countryId}` as const,
  geoCities: (stateId: number | string) => `parametros:geo:cities:${stateId}` as const,
} as const;

// ─── Estados (motor de ciclos de vida, solo lectura) ────────────────────────
export const estadosTags = {
  maquina: (maquina: string) => `estados:maquina:${maquina}` as const,
  transiciones: (maquina: string) => `estados:maquina:${maquina}:transiciones` as const,
} as const;

// ─── PQRS ───────────────────────────────────────────────────────────────────
export const pqrsTags = {
  list: () => 'pqrs:list' as const,
  item: (id: number | string) => `pqrs:item:${id}` as const,
} as const;

// ─── Vehículo ───────────────────────────────────────────────────────────────
export const vehiculoTags = {
  list: () => 'vehiculo:list' as const,
  item: (id: number | string) => `vehiculo:item:${id}` as const,
} as const;
