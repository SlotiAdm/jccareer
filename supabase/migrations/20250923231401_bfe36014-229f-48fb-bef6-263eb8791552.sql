-- Update the communication lab module icon to use correct lucide-react icon name
UPDATE public.training_modules 
SET icon = 'Presentation' 
WHERE name = 'communication_lab';