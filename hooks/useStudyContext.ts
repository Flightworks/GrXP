import { useState, useEffect } from 'react';
import { StudyContext } from '../types';
import { getStudyContext, saveStudyContext, startNewStudy } from '../services/storage';

export const useStudyContext = () => {
    const [context, setContext] = useState<StudyContext>({ studyName: '', experimentation: '', aircraft: '', date: '', globalSynthesis: '' });

    // Load context from storage initially
    const loadContext = () => {
        setContext(getStudyContext());
    };

    useEffect(() => {
        loadContext();
    }, []);

    // Auto-save context when changed
    useEffect(() => {
        if (context.studyName) {
            saveStudyContext(context);
        }
    }, [context]);

    const updateContextField = (field: keyof StudyContext, value: string) => {
        setContext(prev => ({ ...prev, [field]: value }));
    };

    const createNewStudy = () => {
        startNewStudy();
        loadContext();
    };

    return { context, updateContextField, createNewStudy, refreshContext: loadContext };
};
