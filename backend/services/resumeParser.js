const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const parseResume = async (filePath) => {
    const dataBuffer = fs.readFileSync(filePath);
    try {
        let data;
        if (typeof pdf === 'function') {
            data = await pdf(dataBuffer);
        } else if (pdf.default && typeof pdf.default === 'function') {
            data = await pdf.default(dataBuffer);
        } else {
            throw new Error('pdf-parse is not a function');
        }

        const text = data.text;
        console.log('Extracted text length:', text.length);

        const keywords = extractKeywords(text);
        const experienceYears = extractExperience(text);
        return { keywords, experienceYears };
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return { keywords: [], experienceYears: null };
    }
};

const extractKeywords = (text) => {
    // Common technical skills to look for
    const skillList = [
        'React', 'Node.js', 'Python', 'Java', 'Javascript', 'TypeScript', 'SQL', 'NoSQL',
        'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'DevOps', 'QA',
        'Testing', 'Automation', 'Frontend', 'Backend', 'Fullstack', 'Machine Learning',
        'Data Science', 'C++', 'PHP', 'HTML', 'CSS', 'Angular', 'Vue', 'Express'
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();

    skillList.forEach(skill => {
        if (lowerText.includes(skill.toLowerCase())) {
            foundSkills.push(skill);
        }
    });

    // Extract potential job titles (simplified)
    const titles = ['Developer', 'Engineer', 'Analyst', 'Tester', 'Manager', 'Consultant'];
    const foundTitles = [];
    titles.forEach(title => {
        if (lowerText.includes(title.toLowerCase())) {
            // Find the word before it to get context like "Frontend Developer"
            foundTitles.push(title);
        }
    });

    return Array.from(new Set([...foundSkills, ...foundTitles]));
};

const extractExperience = (text) => {
    const expMatch = text.match(/(\d+)\+?\s*years?\b/i);
    return expMatch ? parseInt(expMatch[1]) : null;
};

module.exports = { parseResume };
