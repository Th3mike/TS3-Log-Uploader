// src/LogUploader.js
import React, { useState } from 'react';
import { saveAs } from 'file-saver';

const LogUploader = () => {
  const [file, setFile] = useState(null);
  const [userTimes, setUserTimes] = useState([]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const formatDuration = (durationInSeconds) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} horas e ${remainingMinutes} minutos`;
    }

    return `${minutes} minutos e ${seconds} segundos`;
  };

  const processLogFile = (content) => {
    try {
      const times = {};
      const lines = content.split('\n');
      let validLog = false;

      lines.forEach((line) => {
        const regex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\|INFO \|Client \| (.+?) \| (connected|disconnected)/;
        const match = line.match(regex);

        if (match) {
          validLog = true;
          const timestamp = new Date(match[1]);
          const username = match[2];
          const status = match[3];

          if (status === 'connected') {
            times[username] = { connected: timestamp, disconnected: null };
          } else if (status === 'disconnected' && times[username]) {
            times[username].disconnected = timestamp;
          }
        }
      });

      if (!validLog) {
        alert('Log inválido. Verifique o formato do arquivo.');
        return;
      }

      const results = Object.entries(times).map(([userId, times]) => {
        if (times.disconnected) {
          const duration = (times.disconnected - times.connected) / 1000; // em segundos
          return { userId, duration };
        }
        return { userId, duration: 0 };
      });

      setUserTimes(results);
    } catch (error) {
      console.error('Erro ao processar o arquivo de log:', error);
      alert('Ocorreu um erro ao processar o arquivo. Verifique o formato do log.');
    }
  };

  const handleUpload = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          processLogFile(event.target.result);
        } catch (error) {
          console.error('Erro ao ler o arquivo:', error);
          alert('Ocorreu um erro ao ler o arquivo.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Por favor, selecione um arquivo.');
    }
  };

  const downloadReport = () => {
    const reportContent = userTimes
      .map(({ userId, duration }) => `${userId}: ${formatDuration(duration)}`)
      .join('\n');
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'user_time_report.txt');
  };

  return (
    <div>
      <h1>Upload de Log do TeamSpeak 3</h1>
      <input type="file" accept=".txt" onChange={handleFileChange} />
      <button onClick={handleUpload}>Processar Log</button>
      {userTimes.length > 0 && (
        <div>
          <h2>Resultados</h2>
          <ul>
            {userTimes.map(({ userId, duration }) => (
              <li key={userId}>{userId}: {formatDuration(duration)}</li>
            ))}
          </ul>
          <button onClick={downloadReport}>Baixar Relatório</button>
        </div>
      )}
    </div>
  );
};

export default LogUploader;