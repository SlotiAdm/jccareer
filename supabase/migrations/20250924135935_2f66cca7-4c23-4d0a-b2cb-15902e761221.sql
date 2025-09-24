-- Atualizar títulos dos módulos para "Ferramentas" e remover estimated_time_minutes
UPDATE training_modules SET 
  title = 'Ferramenta de Análise Curricular',
  description = 'Receba um diagnóstico completo e acionável do seu currículo com análises de impacto, palavras-chave e sugestões de melhoria.',
  estimated_time_minutes = NULL
WHERE name = 'curriculum_analysis';

UPDATE training_modules SET 
  title = 'Ferramenta de Análise Curricular',
  description = 'Transforme seu currículo em uma máquina de marketing pessoal',
  estimated_time_minutes = NULL
WHERE name = 'resume_analyzer';

UPDATE training_modules SET 
  title = 'Ferramenta de Entrevistas',
  description = 'Domine a arte da entrevista e transforme ansiedade em confiança',
  estimated_time_minutes = NULL
WHERE name = 'interview_dojo';

UPDATE training_modules SET 
  title = 'Ferramenta de Comunicação',
  description = 'Estrategista de comunicação para análises e mensagens de alto impacto',
  estimated_time_minutes = NULL
WHERE name = 'communication_lab';

UPDATE training_modules SET 
  title = 'Ferramenta ERP',
  description = 'Projete soluções ERP com orientação de IA',
  estimated_time_minutes = NULL
WHERE name = 'erp_simulator';

UPDATE training_modules SET 
  title = 'Ferramenta de Treinamento ERP',
  description = 'Domine sistemas ERP em 3 etapas práticas',
  estimated_time_minutes = NULL
WHERE name = 'erp_training';

UPDATE training_modules SET 
  title = 'Ferramenta de Planilhas',
  description = 'Saia do básico no Excel/Sheets com desafios progressivos',
  estimated_time_minutes = NULL
WHERE name = 'spreadsheet_arena';

UPDATE training_modules SET 
  title = 'Ferramenta Estratégica BSC',
  description = 'Construa um plano estratégico para sua carreira',
  estimated_time_minutes = NULL
WHERE name = 'bsc_strategic';

UPDATE training_modules SET 
  title = 'Ferramenta GPS de Carreira',
  description = 'Diagnóstico de carreira com 3 caminhos futuros',
  estimated_time_minutes = NULL
WHERE name = 'career_gps';