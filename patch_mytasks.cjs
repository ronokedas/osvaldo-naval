const fs = require('fs');
let content = fs.readFileSync('src/components/MyTasks.tsx', 'utf-8');

const regex = /const handleSimulatedFileUpload = \(taskId: string\) => \{[\s\S]*?setSimulatedFile\(null\);\n  \};/;
const newHandler = `
  const handleSimulatedFileUpload = async (taskId: string) => {
    if (!simulatedFile) {
      alert("Selecione um arquivo primeiro.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", simulatedFile);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      onUploadTaskFile(taskId, data.fileName, data.url);
      
      if (selectedTask) {
        setSelectedTask({
          ...selectedTask,
          arquivoNome: data.fileName,
          arquivoUrl: data.url,
        });
      }
      setSimulatedFile(null);
    } catch (err) {
      alert("Falha no upload do arquivo");
      console.error(err);
    }
  };
`;

content = content.replace(regex, newHandler);
fs.writeFileSync('src/components/MyTasks.tsx', content);
