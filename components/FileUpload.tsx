import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { TypeDiscrepancyModal } from './ui/type-discrepancy-modal';

export function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jurisdiction, setJurisdiction] = useState('MEXICO');
  const [docType, setDocType] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [discrepancy, setDiscrepancy] = useState<{
    isOpen: boolean;
    file: File | null;
    jurisdiction: string;
    userType: string;
    iaType: string;
    warningMessage: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    file: null,
    jurisdiction: '',
    userType: '',
    iaType: '',
    warningMessage: '',
    isLoading: false
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (const file of acceptedFiles) {
        let confirmedType = docType;
        let needsRetry = false;
        let retryType: string | null = null;
        do {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('jurisdiction', jurisdiction);
          formData.append('docType', confirmedType || '');

          // Simular progreso
          const progressInterval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          clearInterval(progressInterval);
          setProgress(100);

          if (data.needsConfirmation) {
            // Mostrar modal de discrepancia
            setDiscrepancy({
              isOpen: true,
              file,
              jurisdiction,
              userType: confirmedType,
              iaType: data.legalClassification.ia_suggested_type,
              warningMessage: data.warningMessage,
              isLoading: false
            });
            // Esperar a que el usuario confirme
            return;
          }

          if (!response.ok) {
            throw new Error(data.error || 'Error al subir el archivo');
          }

          setUploadedFiles(prev => [...prev, file.name]);
          toast.success(`Archivo ${file.name} procesado exitosamente`);
          needsRetry = false;
          // Reset progress after a short delay
          setTimeout(() => setProgress(0), 1000);
        } while (needsRetry);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el archivo');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }, [jurisdiction, docType]);

  // Handler para confirmar tipo en el modal
  const handleDiscrepancyConfirm = async (selected: 'user' | 'ia') => {
    if (!discrepancy.file) return;
    // Cerrar el modal antes de procesar
    setDiscrepancy(d => ({ ...d, isOpen: false, isLoading: true }));
    try {
      const formData = new FormData();
      formData.append('file', discrepancy.file);
      formData.append('jurisdiction', discrepancy.jurisdiction);
      formData.append('docType', (selected === 'user' ? discrepancy.userType : discrepancy.iaType) || '');
      formData.append('confirmed', 'true');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el archivo');
      }
      setUploadedFiles(prev => [...prev, discrepancy.file!.name]);
      toast.success(`Archivo ${discrepancy.file!.name} procesado exitosamente`);
      setDiscrepancy({
        isOpen: false,
        file: null,
        jurisdiction: '',
        userType: '',
        iaType: '',
        warningMessage: '',
        isLoading: false
      });
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el archivo');
      setDiscrepancy(d => ({ ...d, isLoading: false }));
    }
  };

  // Handler para cerrar el modal
  const handleDiscrepancyClose = () => {
    setDiscrepancy({
      isOpen: false,
      file: null,
      jurisdiction: '',
      userType: '',
      iaType: '',
      warningMessage: '',
      isLoading: false
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (fileRejections) => {
      const errors = fileRejections[0].errors;
      const errorMessage = errors[0].message;
      toast.error(`Error: ${errorMessage}`);
    }
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <TypeDiscrepancyModal
        isOpen={discrepancy.isOpen}
        onClose={handleDiscrepancyClose}
        onConfirm={handleDiscrepancyConfirm}
        userType={discrepancy.userType}
        iaType={discrepancy.iaType}
        warningMessage={discrepancy.warningMessage}
        isLoading={discrepancy.isLoading}
      />
      {/* Configuración */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Configuración del Documento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="jurisdiction" className="text-sm font-medium">
              Jurisdicción
            </Label>
            <Select value={jurisdiction} onValueChange={setJurisdiction}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar jurisdicción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEXICO">México</SelectItem>
                <SelectItem value="CDMX">Ciudad de México</SelectItem>
                <SelectItem value="EDOMEX">Estado de México</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="docType" className="text-sm font-medium">
              Tipo de Documento
            </Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Constitución">Constitución</SelectItem>
                <SelectItem value="Tratado Internacional">Tratado Internacional</SelectItem>
                <SelectItem value="Ley Federal">Ley Federal (Códigos Federales, Leyes Generales)</SelectItem>
                <SelectItem value="Constitución Local">Constitución Local</SelectItem>
                <SelectItem value="Ley Estatal">Ley Estatal (Código)</SelectItem>
                <SelectItem value="Reglamento">Reglamento (Federales y Estatales)</SelectItem>
                <SelectItem value="Norma Oficial Mexicana">Norma Oficial Mexicana</SelectItem>
                <SelectItem value="Decretos, Acuerdos y Circular Administrativa">Decretos, Acuerdos y Circular Administrativa</SelectItem>
                <SelectItem value="Jurisprudencia">Jurisprudencia</SelectItem>
                <SelectItem value="Acto Jurídico">Acto Jurídico</SelectItem>
                <SelectItem value="Norma Consuetudinaria">Norma Consuetudinaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Archivos subidos */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            Archivos Procesados
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((fileName, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {fileName}
                  </span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400">
                  Procesado exitosamente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Área de upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Procesando archivo...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Por favor espera mientras procesamos tu documento
                </p>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isDragActive
                    ? 'Suelta el archivo aquí'
                    : 'Arrastra y suelta archivos aquí, o haz clic para seleccionar'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Formatos soportados: DOCX, PDF, TXT (máximo 10MB por archivo)
                </p>
                <Button variant="outline" className="bg-white dark:bg-gray-800">
                  Seleccionar archivo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              Información Importante
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Los documentos que subas serán procesados y almacenados de forma segura. 
              Una vez procesados, podrás hacer consultas específicas sobre su contenido 
              en el chat del asistente legal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 