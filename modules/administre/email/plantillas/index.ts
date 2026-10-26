/**
 * Administración Email — Plantillas
 */
export * from './models/plantilla.interface';
export * from './schemas/plantilla.schema';
export { variablesDe, variablesDePlantilla, aplicarVariables } from './utils/variables';
export { PlantillaEmailManager } from './components/plantilla-manager';
export { PlantillaEmailEditorPage, RegisterPlantilla, UpdatePlantilla } from './components/form';
export { PlantillaEmailPreview } from './components/plantilla-preview';
export { VistaHtml } from './components/vista-html';
