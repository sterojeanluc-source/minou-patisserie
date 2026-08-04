import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Image, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { supabase } from './supabaseClient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Importation de notre nouveau Design System modulaire
import Button from './components/Button';
import Input from './components/Input';
import Card from './components/Card';
import Badge from './components/Badge';
import AlertBanner from './components/Alert';
import DataTable from './components/DataTable';
import Tabs from './components/Tabs';
import Toast from './components/Toast';

export default function App() {
  // --- ÉTATS SYSTEMES & SAAS (MULTI-TENANT / MVP VERSION 0.1) ---
  const [lang, setLang] = useState('ht');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');  // 'super_admin', 'school_admin', 'teacher', 'secretary', 'parent'
  const [view, setView] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // --- ÉTATS SAAS (ÉCOLES / TENANTS) ---
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schools, setSchools] = useState([
    { id: 'ecole_lpm_001', nom: 'Lekòl Pam - Delmas', logo: 'https://via.placeholder.com/80/1A365D/FFFFFF?text=LPM', subdomain: 'delmas', statut_abonnement: 'active', theme_color: '#0A1128' },
    { id: 'ecole_lpm_002', nom: 'Collège de la Trinité - Pétion-Ville', logo: 'https://via.placeholder.com/80/D90429/FFFFFF?text=TRINITE', subdomain: 'trinite', statut_abonnement: 'active', theme_color: '#1C2541' },
    { id: 'ecole_lpm_003', nom: 'Institution Saint-Louis de Gonzague', logo: 'https://via.placeholder.com/80/06D6A0/FFFFFF?text=SLG', subdomain: 'slg', statut_abonnement: 'active', theme_color: '#131A35' }
  ]);

  // --- ÉTATS DONNÉES ÉLÈVES (FILTRÉS PAR ECOLE_ID) ---
  const [student, setStudent] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [grades, setGrades] = useState([]);
  const [calculatedAverage, setCalculatedAverage] = useState(0);
  const [rank, setRank] = useState('...');
  const [totalClass, setTotalClass] = useState(0);
  const [presenceStatus, setPresenceStatus] = useState('...');
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ totalEncaisse: 0, totalTeachers: 5, totalStudents: 150, todayAttendance: 94, alertCount: 3 });
  const [kLog, setKLog] = useState(null);
  const [disciplineLogs, setDisciplineLogs] = useState([]);

  // --- FILTRE TRIMESTRE ---
  const [selectedPeriode, setSelectedPeriode] = useState(1);

  // --- ÉTATS FORMULAIRES ---
  const [newSchoolForm, setNewSchoolForm] = useState({ nom: '', subdomain: '', initialFee: '15000' });
  const [newStudent, setNewStudent] = useState({ nom: '', prenom: '', classe: '9ème AF', telephone_parent: '', solde_du: '15000' });
  const [notesMap, setNotesMap] = useState({});
  const [currentSubject, setCurrentSubject] = useState('Mathématiques');
  const [selectedClass, setSelectedClass] = useState('Toutes');
  const [disciplineNotes, setDisciplineNotes] = useState({});

  const classesDisponibles = ['Toutes', 'Kindergarten', '1ère AF', '6ème AF', '9ème AF', 'NS4'];
  const matieresDisponibles = ['Mathématiques', 'Physique', 'SVT', 'Chimie', 'Français', 'Anglais', 'Créole'];

  // --- TRADUCTIONS SAAS ---
  const translations = {
    fr: {
      welcome: "Lekòl Pam SaaS",
      login_sub: "Portail Multi-Écoles",
      connect: "SE CONNECTER",
      logout: "Déconnexion",
      average: "Moyenne",
      solde: "Reste à payer",
      bulletin_btn: "Télécharger le Bulletin PDF",
      locked: "🔒 Bulletin Bloqué",
      news: "📢 ALERTE ÉCOLE",
      pay: "Payer avec MonCash",
      presence: "Présence",
      stats: "Tableau de Bord",
      teacher: "Espace Prof",
      enroll: "Inscription / Nouveau",
      rank: "Rang",
      term: "Trimestre",
      sync_now: "Synchroniser maintenant",
      locked_desc: "Veuillez solder votre compte pour débloquer automatiquement le bulletin de votre enfant.",
      repas: "Repas",
      sieste: "Sieste",
      cahier_liaison: "Cahier de Liaison Maternelle",
      input_placeholder: "Téléphone Parent ou Identifiant ('admin', 'prof', 'super')",
      class_filter: "Classe :",
      subject_filter: "Matière :",
      save_grades: "Enregistrer les Notes",
      choose_child_title: "Sélectionnez un enfant",
      choose_child_sub: "Veuillez choisir le profil à consulter :",
      debt_progress: "Dette réglée",
      online: "En ligne",
      syncing: "Mise à jour...",
      reg_title: "Formulaire d'Inscription Élève",
      reg_nom: "Nom de l'élève",
      reg_prenom: "Prénom de l'élève",
      reg_parent_tel: "Téléphone du Parent",
      reg_solde: "Frais de scolarité (HTG)",
      reg_submit: "Inscrire l'Élève",
      attendance_sec: "Présence du jour",
      presence_p: "Présent",
      presence_a: "Absent",
      presence_l: "En Retard",
      liaison_sec: "Liaison Kindergarten (Repas / Sieste)",
      discipline_sec: "Signaler un Incident de Discipline",
      discipline_parent_title: "🚨 Rapport de Discipline",
      saas_onboarding: "🏫 Ajouter une Nouvelle École (SaaS Onboarding)",
      school_name: "Nom de l'école",
      school_subdomain: "Sous-domaine / Ville",
      school_submit: "Créer l'Espace École",
      switch_school: "Changer d'École Active :",
      saas_title: "🚀 Super-Administration SaaS",
      saas_subtitle: "Statistiques Globales multi-établissements"
    },
    ht: {
      welcome: "Lekòl Pam SaaS",
      login_sub: "Pòtay Tout Lekòl Yo",
      connect: "KONEKTE",
      logout: "Quitter",
      average: "MWAYÈN",
      solde: "RÈS POU PEYE",
      bulletin_btn: "Telechaje Bilten PDF",
      locked: "🔒 Bilten bloke",
      news: "📢 Alèt Lekòl",
      pay: "Paye ak MonCash kounye a",
      presence: "Prezans",
      stats: "Biwo",
      teacher: "Pwof",
      enroll: "Enskripsyon",
      rank: "RAN",
      term: "Trimès",
      sync_now: "Senkwonize kounye a",
      locked_desc: "Fini peye frè yo pou wè nòt pitit ou a.",
      repas: "Repas",
      sieste: "Sieste",
      cahier_liaison: "🍼 Kàyè Swivi Kindergarten (Jodi a)",
      input_placeholder: "Telefòn Paran oswa Identifyan ('admin', 'prof', 'super')",
      class_filter: "Klas :",
      subject_filter: "Matiè :",
      save_grades: "Anrejistre Nòt Yo",
      choose_child_title: "Chwazi yon timoun",
      choose_child_sub: "Tanpri chwazi pwofil ou vle gade a :",
      debt_progress: "Frè lekòl peye",
      online: "Anliy",
      syncing: "Ap senkronize...",
      reg_title: "Fòm Enskripsyon Nouvo Elèv",
      reg_nom: "Siyati elèv la",
      reg_prenom: "Non elèv la",
      reg_parent_tel: "Telefòn Paran",
      reg_solde: "Frè Lekòl pou peye (HTG)",
      reg_submit: "Anrejistre Elèv La",
      attendance_sec: "Prezans pou jodi a",
      presence_p: "La",
      presence_a: "Pa la",
      presence_l: "An Reta",
      liaison_sec: "Kaye Kindergarten (Manje / Dòmi)",
      discipline_sec: "Siyalman Disiplin",
      discipline_parent_title: "🚨 Rapò Disiplin",
      saas_onboarding: "🏫 Enskri yon lòt Lekòl (SaaS Onboarding)",
      school_name: "Non Lekòl la",
      school_subdomain: "Sous-domèn / Vil",
      school_submit: "Kreye Espas Lekòl la",
      switch_school: "Chwazi Lekòl pou w jere :",
      saas_title: "🚀 Super-Administrasyon SaaS",
      saas_subtitle: "Estatistik ak pèfòmans tout lekòl yo"
    }
  };
  const t = (key) => translations[lang][key] || key;

  // --- AUTOMATIC LOADING & SYNCING ---
  useEffect(() => {
    if (isLoggedIn) {
      fetchAnnouncements();
      if (view === 'parent' && student?.id) {
        fetchParentData();
      } else if (view === 'admin' || view === 'teacher' || view === 'enrollment') {
        fetchAdminTeacherData();
      }
    }
  }, [view, isLoggedIn, student?.id, selectedPeriode, selectedSchoolId]);

  // Restauration automatique de session depuis AsyncStorage au démarrage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('app_lang');
        if (savedLang) setLang(savedLang);

        const cachedUser = await AsyncStorage.getItem('cached_user_session');
        if (cachedUser) {
          const session = JSON.parse(cachedUser);
          setUserRole(session.role);
          setView(session.view);
          if (session.student) setStudent(session.student);
          if (session.studentsList) setStudentsList(session.studentsList);
          if (session.selectedSchoolId) setSelectedSchoolId(session.selectedSchoolId);
          setIsLoggedIn(true);
        }

        const cachedSchools = await AsyncStorage.getItem('cached_saas_schools');
        if (cachedSchools) {
          setSchools(JSON.parse(cachedSchools));
        }
      } catch (e) {
        console.warn("Erreur de récupération du cache local", e);
      }
    };
    restoreSession();
  }, []);

  // Hook de sauvegarde automatique d'état de session dans AsyncStorage
  useEffect(() => {
    const saveSession = async () => {
      try {
        if (isLoggedIn) {
          await AsyncStorage.setItem('cached_user_session', JSON.stringify({
            role: userRole,
            view: view,
            student: student,
            studentsList: studentsList,
            selectedSchoolId: selectedSchoolId
          }));
        }
        await AsyncStorage.setItem('cached_saas_schools', JSON.stringify(schools));
      } catch (e) {
        console.warn("Erreur de sauvegarde de la session", e);
      }
    };
    saveSession();
  }, [isLoggedIn, userRole, view, student, studentsList, selectedSchoolId, schools]);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('annonces')
      .select('*')
      .eq('ecole_id', selectedSchoolId)
      .order('date_creation', { ascending: false })
      .limit(2);
    if (data && data.length > 0) {
      setAnnouncements(data);
      await AsyncStorage.setItem('cached_announcements', JSON.stringify(data));
    } else {
      // Fallback local mock alerts
      setAnnouncements([
        { id: 'a1', titre: 'Avi Finansyè', message: 'Tanpri solde kont nou avan egzamen trimès yo.' }
      ]);
    }
  };

  const fetchParentData = async () => {
    if (!student?.id) return;
    setLoading(true);

    try {
      // 1. Infos Élève mis à jour de façon sécurisée (avec maybeSingle pour éviter les crashes)
      const { data: sData } = await supabase
        .from('eleves')
        .select('*')
        .eq('id', student.id)
        .eq('ecole_id', selectedSchoolId)
        .maybeSingle();
      if (sData) {
        setStudent(sData);
      }

      // 2. Notes filtrées par PÉRIODE + calcul de la MOYENNE PONDÉRÉE (Coefficients)
      const { data: gData } = await supabase
        .from('notes')
        .select('*')
        .eq('eleve_id', student.id)
        .eq('periode', selectedPeriode)
        .eq('ecole_id', selectedSchoolId);

      if (gData) {
        setGrades(gData);

        let totalPoints = 0;
        let totalCoefficients = 0;

        gData.forEach(item => {
          const coef = item.coefficient || 1;
          totalPoints += item.note * coef;
          totalCoefficients += coef;
        });

        const avg = totalCoefficients > 0 ? (totalPoints / totalCoefficients).toFixed(1) : 0;
        setCalculatedAverage(avg);
      }

      // 3. CALCUL DU RANG (PALMARÈS) pour le trimestre sélectionné
      const { data: classMates } = await supabase
        .from('eleves')
        .select('id, classe')
        .eq('classe', student.classe)
        .eq('ecole_id', selectedSchoolId);

      if (classMates) {
        setTotalClass(classMates.length);
        const classMatesIds = classMates.map(c => c.id);

        // On récupère toutes les notes de la classe pour ce trimestre
        const { data: allClassGrades } = await supabase
          .from('notes')
          .select('eleve_id, note, coefficient')
          .in('eleve_id', classMatesIds)
          .eq('periode', selectedPeriode)
          .eq('ecole_id', selectedSchoolId);

        if (allClassGrades) {
          const leaderboard = classMates.map(member => {
            const memberGrades = allClassGrades.filter(g => g.eleve_id === member.id);
            let pts = 0;
            let coefs = 0;
            memberGrades.forEach(g => {
              const c = g.coefficient || 1;
              pts += g.note * c;
              coefs += c;
            });
            return {
              id: member.id,
              avg: coefs > 0 ? pts / coefs : 0
            };
          });

          // Tri décroissant
          leaderboard.sort((a, b) => b.avg - a.avg);
          const pos = leaderboard.findIndex(s => s.id === student.id) + 1;
          setRank(pos === 1 ? '1er' : `${pos}e`);
        }
      }

      // 4. Présences (utilisation de maybeSingle() pour la sécurité)
      const today = new Date().toISOString().split('T')[0];
      const { data: pData } = await supabase
        .from('presences')
        .select('statut')
        .eq('eleve_id', student.id)
        .eq('date', today)
        .eq('ecole_id', selectedSchoolId)
        .maybeSingle();
      setPresenceStatus(pData ? pData.statut : 'Non marqué');

      // 5. Récupération des logs de Maternelle (si l'élève est en Kindergarten)
      if (student.classe === 'Kindergarten') {
        const { data: kData } = await supabase
          .from('Kindergarden')
          .select('*')
          .eq('eleve_id', student.id)
          .eq('date_suivi', today)
          .eq('ecole_id', selectedSchoolId)
          .maybeSingle();
        setKLog(kData);
      } else {
        setKLog(null);
      }

      // 6. Récupération unifiée des incidents disciplinaires (table: disciplines)
      const { data: discData } = await supabase
        .from('disciplines')
        .select('*')
        .eq('eleve_id', student.id)
        .eq('ecole_id', selectedSchoolId)
        .order('date_incident', { ascending: false });
      if (discData) {
        setDisciplineLogs(discData);
      }
    } catch (err) {
      console.error("Erreur de chargement", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminTeacherData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('eleves')
        .select('*')
        .eq('ecole_id', selectedSchoolId)
        .order('nom');
      if (data) {
        setStudentsList(data);
        const encaisse = data.reduce((acc, s) => acc + (15000 - s.solde_du), 0);
        setStats(prev => ({
          ...prev,
          totalEncaisse: encaisse,
          totalStudents: data.length
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manuel Sync Trigger
  const handleManualSync = async () => {
    setIsSyncing(true);
    if (view === 'parent' && student) {
      await fetchParentData();
    } else {
      await fetchAdminTeacherData();
    }
    await fetchAnnouncements();
    setIsSyncing(false);
    showToast("Tout done yo senkronize byen!");
  };

  // --- ACTIONS PHOTO ---
  const takePhoto = async (studentId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Erreur", "Accès caméra refusé.");

    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) {
      uploadImage(studentId, result.assets[0].uri);
    }
  };

  const uploadImage = async (studentId, uri) => {
    showToast("Mize a jou foto...");
    const { error } = await supabase
      .from('eleves')
      .update({ photo_url: uri })
      .eq('id', studentId)
      .eq('ecole_id', selectedSchoolId);
    if (!error) {
      fetchAdminTeacherData();
    } else {
      Alert.alert("Erreur", error.message);
    }
  };

  // --- CONNEXION & AUTHENTIFICATION (SaaS Multi-tenant Aware / Version 0.1) ---
  const handleLogin = async () => {
    if (!loginPhone.trim()) {
      return Alert.alert("Erreur", "Veuillez entrer un identifiant ou numéro.");
    }
    setLoading(true);
    const id = loginPhone.toLowerCase().trim();
    let currentRole = '';
    let currentView = '';
    let selectedStudent = null;
    let list = [];

    // Sélection automatique de l'école par défaut si vide
    const effectiveSchoolId = selectedSchoolId || schools[0].id;

    try {
      if (id === 'super') {
        currentRole = 'super_admin';
        currentView = 'super_admin';
        setIsLoggedIn(true);
        setUserRole('super_admin');
        setView('super_admin');
      } else if (id === 'admin') {
        currentRole = 'school_admin';
        currentView = 'admin';
        setIsLoggedIn(true);
        setUserRole('school_admin');
        setView('admin');
        setSelectedSchoolId(effectiveSchoolId);
      } else if (id === 'prof') {
        currentRole = 'teacher';
        currentView = 'teacher';
        setIsLoggedIn(true);
        setUserRole('teacher');
        setView('teacher');
        setSelectedSchoolId(effectiveSchoolId);
      } else if (id === 'secretaire') {
        currentRole = 'secretary';
        currentView = 'enrollment';
        setIsLoggedIn(true);
        setUserRole('secretary');
        setView('enrollment');
        setSelectedSchoolId(effectiveSchoolId);
      } else {
        const { data } = await supabase
          .from('eleves')
          .select('*')
          .eq('telephone_parent', loginPhone);
        if (data && data.length > 0) {
          list = data;
          setStudentsList(data);
          setIsLoggedIn(true);
          setUserRole('parent');
          currentRole = 'parent';

          if (data.length === 1) {
            selectedStudent = data[0];
            setStudent(data[0]);
            currentView = 'parent';
            setView('parent');
            setSelectedSchoolId(data[0].ecole_id || effectiveSchoolId);
          } else {
            currentView = 'choose_child';
            setView('choose_child');
          }
        } else {
          Alert.alert("Erreur", "Paran sa a pa anrejistre nan sistèm nan.");
        }
      }

      // Enregistrement de la session locale dans AsyncStorage
      if (currentRole) {
        await AsyncStorage.setItem('cached_user_session', JSON.stringify({
          role: currentRole,
          view: currentView,
          student: selectedStudent,
          studentsList: list,
          selectedSchoolId: selectedSchoolId || effectiveSchoolId
        }));
      }
    } catch (err) {
      Alert.alert("Erreur", "Koneksyon echwe.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('cached_user_session');
    setIsLoggedIn(false);
    setUserRole('');
    setView('');
    setStudent(null);
    setStudentsList([]);
    setGrades([]);
  };

  const updateDebt = async (id, montant) => {
    await supabase
      .from('eleves')
      .update({ solde_du: montant, statut_paiement: montant === 0 ? 'Payé' : 'Impayé' })
      .eq('id', id)
      .eq('ecole_id', selectedSchoolId);
    if (view === 'parent') fetchParentData(); else fetchAdminTeacherData();
  };

  // --- REGISTRATION / ENROLLMENT (SECRETAIRE/ADMIN FORM) ---
  const handleRegisterStudent = async () => {
    if (!newStudent.nom.trim() || !newStudent.prenom.trim() || !newStudent.telephone_parent.trim()) {
      return Alert.alert("Erreur", "Tanpri ranpli tout chan yo!");
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('eleves')
        .insert({
          nom: newStudent.nom,
          prenom: newStudent.prenom,
          classe: newStudent.classe,
          telephone_parent: newStudent.telephone_parent,
          solde_du: parseFloat(newStudent.solde_du || '15000'),
          statut_paiement: 'Impayé',
          ecole_id: selectedSchoolId
        });
      if (error) throw error;

      showToast(`Elèv la ${newStudent.prenom} anrejistre!`);
      setNewStudent({ nom: '', prenom: '', classe: '9ème AF', telephone_parent: '', solde_du: '15000' });
      fetchAdminTeacherData();
    } catch (err) {
      Alert.alert("Erreur", err.message || "Echèk pandan enskripsyon.");
    } finally {
      setLoading(false);
    }
  };

  // --- ATTENDANCE SYSTEM (TEACHER PORTAL) ---
  const markPresence = async (studentId, status) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: existingPresence } = await supabase
        .from('presences')
        .select('id')
        .eq('eleve_id', studentId)
        .eq('date', today)
        .eq('ecole_id', selectedSchoolId)
        .maybeSingle();

      if (existingPresence) {
        await supabase
          .from('presences')
          .update({ statut: status })
          .eq('id', existingPresence.id);
      } else {
        await supabase
          .from('presences')
          .insert({
            eleve_id: studentId,
            date: today,
            statut: status,
            ecole_id: selectedSchoolId
          });
      }
      showToast(`Siyalman "${status}" anrejistre !`);
      fetchAdminTeacherData();
    } catch (err) {
      Alert.alert("Erreur", "Echèk pandan siyalman prezans.");
    }
  };

  // --- MATERNELLE / KINDERGARTEN DAILY LIAISON ---
  const saveKLog = async (studentId, type, val) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: existingK } = await supabase
        .from('Kindergarden')
        .select('id')
        .eq('eleve_id', studentId)
        .eq('date_suivi', today)
        .eq('ecole_id', selectedSchoolId)
        .maybeSingle();

      const updatePayload = {};
      updatePayload[type] = val;

      if (existingK) {
        await supabase
          .from('Kindergarden')
          .update(updatePayload)
          .eq('id', existingK.id);
      } else {
        const insertPayload = {
          eleve_id: studentId,
          date_suivi: today,
          repas: false,
          sieste: false,
          ecole_id: selectedSchoolId
        };
        insertPayload[type] = val;
        await supabase.from('Kindergarden').insert(insertPayload);
      }
      showToast("Liaison maternelle ajou!");
      fetchAdminTeacherData();
    } catch (err) {
      Alert.alert("Erreur", "Echèk pandan mizajou kaye Kindergarten.");
    }
  };

  // --- REPORT INCIDENTS DISCIPLINE (Table: disciplines, Colonnes: eleve_id, incident, date_incident) ---
  const addDisciplineIncident = async (studentId) => {
    const note = disciplineNotes[studentId];
    if (!note || !note.trim()) {
      return Alert.alert("Erreur", "Tanpri ekri rezon an anvan.");
    }

    try {
      const { error } = await supabase
        .from('disciplines')
        .insert({
          eleve_id: studentId,
          incident: note.trim(),
          date_incident: new Date().toISOString().split('T')[0],
          ecole_id: selectedSchoolId
        });

      if (error) throw error;
      showToast("Ensidan disiplin anrejistre !");
      setDisciplineNotes(prev => ({ ...prev, [studentId]: '' }));
    } catch (err) {
      Alert.alert("Erreur", "Pa kapab anrejistre ensidan sa a.");
    }
  };

  // --- ENREGISTREMENT DES NOTES (ESPACE ENSEIGNANT) ---
  const saveTeacherGrades = async () => {
    setLoading(true);
    try {
      const promises = Object.keys(notesMap).map(async (studentId) => {
        const noteValue = parseFloat(notesMap[studentId]);
        if (isNaN(noteValue)) return;

        // On vérifie s'il existe déjà une note
        const { data: existingGrade } = await supabase
          .from('notes')
          .select('id')
          .eq('eleve_id', studentId)
          .eq('matiere', currentSubject)
          .eq('periode', selectedPeriode)
          .eq('ecole_id', selectedSchoolId)
          .maybeSingle();

        if (existingGrade) {
          return supabase
            .from('notes')
            .update({ note: noteValue })
            .eq('id', existingGrade.id);
        } else {
          return supabase
            .from('notes')
            .insert({
              eleve_id: studentId,
              matiere: currentSubject,
              note: noteValue,
              periode: selectedPeriode,
              coefficient: 1,
              ecole_id: selectedSchoolId
            });
        }
      });

      await Promise.all(promises);
      showToast("Tout nòt yo anrejistre!");
      setNotesMap({});
      fetchAdminTeacherData();
    } catch (err) {
      Alert.alert("Erreur", "Echèk pandan anrejistreman an.");
    } finally {
      setLoading(false);
    }
  };

  // --- ONBOARDING NOUVELLE ECOLE (SaaS Feature) ---
  const handleCreateSchool = () => {
    if (!newSchoolForm.nom.trim() || !newSchoolForm.subdomain.trim()) {
      return Alert.alert("Erreur", "Tanpri ranpli tout chan lekòl yo!");
    }
    const newId = `ecole_lpm_00${schools.length + 1}`;
    const newSchoolObj = {
      id: newId,
      nom: newSchoolForm.nom,
      logo: 'https://via.placeholder.com/80/7D8597/FFFFFF?text=' + newSchoolForm.subdomain.toUpperCase(),
      subdomain: newSchoolForm.subdomain.toLowerCase(),
      statut_abonnement: 'active',
      theme_color: '#1C2541'
    };

    setSchools(prev => [...prev, newSchoolObj]);
    setNewSchoolForm({ nom: '', subdomain: '', initialFee: '15000' });
    showToast("Lekòl la kreye ak siksè !");
  };

  const changeLanguage = async () => {
    const newLang = lang === 'fr' ? 'ht' : 'fr';
    setLang(newLang);
    await AsyncStorage.setItem('app_lang', newLang);
  };

  const generatePDF = async () => {
    if (!student) return;
    const gradesHtml = grades.map(g => `<tr><td>${g.matiere}</td><td align="center">Coeff: ${g.coefficient || 1}</td><td align="center"><b>${g.note}/10</b></td></tr>`).join('');
    const htmlContent = `<html><body style="padding:40px; font-family:sans-serif; text-align:center; background-color:#FAFAFA;">
      <div style="border: 2px solid #1A365D; padding: 20px; border-radius: 10px; background:#FFF;">
        <h1 style="color:#1A365D; margin-bottom:5px;">Lekòl Pam</h1>
        <h3 style="color:#555; margin-top:0;">Portail Éducatif Officiel</h3>
        <hr style="border-color:#1A365D" />
        <h2>Trimestre ${selectedPeriode}</h2>
        <p>Élève: <b>${student.prenom} ${student.nom}</b> | Classe: ${student.classe}</p>
        <table width="100%" border="1" cellpadding="10" style="border-collapse:collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #EDF2F7;">
              <th>Matière</th>
              <th>Coefficient</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            ${gradesHtml}
          </tbody>
        </table>
        <h3 style="margin-top: 30px; color:#1A365D;">Moyenne Générale: ${calculatedAverage}/10 | Rang: ${rank}</h3>
      </div>
    </body></html>`;
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri);
  };

  // --- RENDU PORTAIL CONNEXION ---
  if (!isLoggedIn) return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />
      <View style={styles.loginCard}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>L</Text>
        </View>
        <Text style={styles.loginTitle}>{t('welcome')}</Text>
        <Text style={styles.loginSub}>{t('login_sub')}</Text>

        {/* Sélecteur d'école lors du Login */}
        <Text style={[styles.label, {color: '#8DA9C4', alignSelf: 'flex-start', marginTop: 10}]}>{t('switch_school')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 10, maxHeight: 50}}>
          <View style={{flexDirection: 'row'}}>
            {schools.map(sch => (
              <TouchableOpacity
                key={sch.id}
                style={[styles.smallFilterBtn, (selectedSchoolId === sch.id || (!selectedSchoolId && schools[0].id === sch.id)) && styles.smallFilterBtnActive]}
                onPress={() => setSelectedSchoolId(sch.id)}
              >
                <Text style={[styles.filterBtnText, (selectedSchoolId === sch.id || (!selectedSchoolId && schools[0].id === sch.id)) && styles.filterBtnTextActive]}>{sch.nom.split(' - ')[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Input
          placeholder={t('input_placeholder')}
          value={loginPhone}
          onChangeText={setLoginPhone}
          keyboardType="default"
        />

        <Button title={t('connect')} onPress={handleLogin} loading={loading} style={{ width: '100%', marginTop: 10 }} />

        <TouchableOpacity onPress={changeLanguage} style={{marginTop:30}}>
          <Text style={styles.langToggleText}>
            {lang === 'fr' ? 'Switch to Kreyòl 🇭🇹' : 'Changer en Français 🇫🇷'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />

      {/* HEADER PREMIUM (SaaS Multi-tenant / Dynamic school label) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.miniLogo}><Text style={styles.miniLogoText}>L</Text></View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{schools.find(s => s.id === selectedSchoolId)?.nom || t('welcome')}</Text>
              <Text style={styles.headerSubtitle}>{view === 'parent' ? t('login_sub') : t('stats')}</Text>
            </View>
          </View>
          <View style={{flexDirection:'row', alignItems:'center'}}>
             <View style={styles.onlineBadge}>
               <View style={styles.pulseDot} />
               <Text style={styles.onlineText}>{isSyncing ? t('syncing') : t('online')}</Text>
             </View>
             <TouchableOpacity onPress={changeLanguage} style={styles.langBadge}>
               <Text style={styles.langText}>{lang.toUpperCase()}</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
               <Text style={styles.logoutText}>{t('logout')}</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* TABS ADMIN/SECRETAIRE/SUPER-ADMIN */}
        {(userRole === 'school_admin' || userRole === 'secretary' || userRole === 'super_admin') && (
          <View style={styles.tabBar}>
            {userRole === 'super_admin' && (
              <TouchableOpacity onPress={() => setView('super_admin')} style={[styles.tab, view === 'super_admin' && styles.tabActive]}>
                <Text style={[styles.tabText, view === 'super_admin' && styles.tabTextActive]}>SaaS</Text>
              </TouchableOpacity>
            )}
            {(userRole === 'school_admin' || userRole === 'super_admin') && (
              <TouchableOpacity onPress={() => setView('admin')} style={[styles.tab, view === 'admin' && styles.tabActive]}>
                <Text style={[styles.tabText, view === 'admin' && styles.tabTextActive]}>{t('stats')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setView('teacher')} style={[styles.tab, view === 'teacher' && styles.tabActive]}>
              <Text style={[styles.tabText, view === 'teacher' && styles.tabTextActive]}>{t('teacher')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setView('enrollment')} style={[styles.tab, view === 'enrollment' && styles.tabActive]}>
              <Text style={[styles.tabText, view === 'enrollment' && styles.tabTextActive]}>{t('enroll')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ANNONCES / ALERTS */}
        {announcements.map(a => (
          <View key={a.id} style={styles.announcementBanner}>
            <Text style={styles.announcementTitle}>{t('news')}</Text>
            <Text style={styles.announcementMsg}>{a.message || a.titre}</Text>
          </View>
        ))}

        {/* --- 1. CHOOSE CHILD VIEW (Cas multi-enfants) --- */}
        {view === 'choose_child' && (
          <Card>
            <Text style={styles.cardTitle}>{t('choose_child_title')}</Text>
            <Text style={styles.subtext}>{t('choose_child_sub')}</Text>
            <View style={styles.childGrid}>
              {studentsList.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.childAvatarCard}
                  onPress={() => { setStudent(s); setView('parent'); setSelectedSchoolId(s.ecole_id || schools[0].id); }}
                >
                  <Image source={{ uri: s.photo_url || 'https://via.placeholder.com/100' }} style={styles.largeAvatar} />
                  <Text style={styles.childAvatarName}>{s.prenom}</Text>
                  <Text style={styles.childAvatarClass}>{s.classe}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* --- 2. VUE PARENT (FLOW COMPLET AVEC BLOCAGE DE DETTE) --- */}
        {view === 'parent' && student && (
          <View>
            {/* AVATAR HORIZONTAL ROW (Si multi-enfant pour basculer facilement) */}
            {studentsList.length > 1 && (
              <View style={styles.horizontalScrollContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
                  {studentsList.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => { setStudent(s); setSelectedSchoolId(s.ecole_id || schools[0].id); }}
                      style={[styles.avatarBadge, student.id === s.id && styles.avatarBadgeActive]}
                    >
                      <Image source={{ uri: s.photo_url || 'https://via.placeholder.com/100' }} style={styles.miniAvatar} />
                      <Text style={[styles.miniAvatarName, student.id === s.id && styles.miniAvatarNameActive]}>{s.prenom}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* CARTE ÉLÈVE PRINCIPALE */}
            <Card>
               <View style={styles.row}>
                  <Image source={{ uri: student.photo_url || 'https://via.placeholder.com/100' }} style={styles.mainAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{student.prenom} {student.nom}</Text>
                    <Text style={styles.studentClass}>{student.classe}</Text>
                    <View style={styles.badgeRow}>
                      <Badge label={student.solde_du > 1000 ? 'An reta peman' : 'Kont règle'} variant={student.solde_du > 1000 ? 'danger' : 'success'} style={{ marginRight: 8 }} />
                      <Badge label={`${t('presence')}: ${presenceStatus}`} variant="info" />
                    </View>
                  </View>
               </View>
            </Card>

            {/* BARRE DE SÉLECTION DE TRIMESTRE (Utilisation du composant Tabs de notre Design System) */}
            <Card>
              <Text style={styles.sectionTitle}>{t('term')} :</Text>
              <Tabs
                tabs={[
                  { id: 1, label: 'T1' },
                  { id: 2, label: 'T2' },
                  { id: 3, label: 'T3' }
                ]}
                activeTab={selectedPeriode}
                onTabPress={setSelectedPeriode}
              />
            </Card>

            {/* BULLETIN (SI COMPTE EN RÈGLE OU PETITE DETTE < 1000 HTG) */}
            {student.solde_du <= 1000 ? (
              <View>
                {/* MOYENNE ET RANG */}
                <Card style={{backgroundColor:'#131A35'}}>
                   <View style={styles.row}>
                      <View style={styles.kpiBox}>
                        <Text style={styles.kpiLabel}>{t('average')}</Text>
                        <Text style={styles.kpiValue}>{calculatedAverage}/10</Text>
                      </View>
                      <View style={styles.kpiBox}>
                        <Text style={styles.kpiLabel}>{t('rank')}</Text>
                        <Text style={[styles.kpiValue, {color: '#FFCC00'}]}>{rank} / {totalClass || '...'}</Text>
                      </View>
                   </View>
                </Card>

                {/* TABLEAU DES NOTES EN DIRECT (Composant DataTable) */}
                <Card>
                  <Text style={styles.gradesCardTitle}>Nòt pou Trimès sa a</Text>
                  <DataTable
                    headers={[
                      { key: 'matiere', label: 'Matière', flex: 2 },
                      { key: 'coefficient', label: 'Coef', flex: 1 },
                      { key: 'note', label: 'Note', flex: 1 }
                    ]}
                    data={grades}
                    emptyText="Pa gen nòt ki anrejistre pou trimès sa a."
                  />
                </Card>
              </View>
            ) : (
              /* BULLETIN BLOQUÉ POUR NON-PAIEMENT */
              <View style={styles.lockedContainer}>
                <View style={styles.lockedIconBg}>
                  <Text style={{fontSize: 40}}>🔒</Text>
                </View>
                <Text style={styles.lockedTitle}>{t('locked')}</Text>
                <Text style={styles.lockedDesc}>{t('locked_desc')}</Text>
              </View>
            )}

            {/* SUIVI MATERNELLE (KINDERGARTEN) */}
            {student.classe === 'Kindergarten' && (
              <Card>
                <Text style={styles.liaisonHeader}>{t('cahier_liaison')}</Text>
                {kLog ? (
                  <View style={styles.kLogContainer}>
                    <Text style={styles.kLogItem}>🥣 {t('repas')} : <Text style={styles.bold}>{kLog.repas ? '✅ Oui' : '❌ Non'}</Text></Text>
                    <Text style={styles.kLogItem}>😴 {t('sieste')} : <Text style={styles.bold}>{kLog.sieste ? '✅ Oui' : '❌ Non'}</Text></Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>Pa gen done anrejistre pou jodi a.</Text>
                )}
              </Card>
            )}

            {/* RAPPORT DE DISCIPLINE */}
            {disciplineLogs.length > 0 && (
              <Card>
                <Text style={styles.liaisonHeader}>{t('discipline_parent_title')}</Text>
                {disciplineLogs.map((log) => (
                  <View key={log.id} style={styles.disciplineLogItem}>
                    <Text style={{color: '#FFB3C1', fontSize: 13, fontWeight: 'bold'}}>{log.date_incident}</Text>
                    <Text style={{color: '#FFF', fontSize: 13, marginTop: 2}}>{log.incident}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* SOLDE BANCAIRE ET OPTIONS DE PAIEMENT */}
            <Card>
               <Text style={styles.paymentLabel}>{t('solde')}</Text>
               <Text style={styles.paymentAmount}>{student.solde_du} HTG</Text>

               {/* Barre de progression de la dèt */}
               <View style={styles.progressContainer}>
                 <View style={styles.progressBarBg}>
                   <View style={[styles.progressBarFill, {width: `${Math.max(0, Math.min(100, ((45000 - student.solde_du) / 45000) * 100))}%`}]} />
                 </View>
                 <Text style={styles.progressText}>{45000 - student.solde_du} / 45000 HTG ({t('debt_progress')})</Text>
               </View>

               {student.solde_du > 0 && (
                 <Button title={`💳 ${t('pay')}`} onPress={() => {
                   Alert.alert("MonCash", "Peman simulation an kòmanse...");
                   updateDebt(student.id, 0);
                 }} style={{ backgroundColor: '#FFCC00' }} textStyle={{ color: '#0A1128' }} />
               )}

               <Button
                 title={student.solde_du > 1000 ? t('locked') : t('bulletin_btn')}
                 onPress={generatePDF}
                 disabled={student.solde_du > 1000}
                 variant="secondary"
               />
            </Card>

            {/* GRILLE D'ACTIONS RAPIDES */}
            <View style={styles.quickActionGrid}>
              <TouchableOpacity style={styles.actionGridItem} onPress={() => Alert.alert("Orè", "Klas yo kòmanse a 8è nan maten.")}>
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionLabel}>Orè</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionGridItem} onPress={() => Alert.alert("Devwa", "Pa gen devwa pou jodi a.")}>
                <Text style={styles.actionIcon}>📚</Text>
                <Text style={styles.actionLabel}>Devwa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionGridItem} onPress={() => Alert.alert("Mesaj", "Tout pwofesè yo la.")}>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionLabel}>Mesaj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionGridItem} onPress={() => Alert.alert("Kontak", "Tel: +509 3737-1212")}>
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionLabel}>Kontak</Text>
              </TouchableOpacity>
            </View>

            {/* BOUTON DE SYNCHRONISATION MANUELLE */}
            <TouchableOpacity style={styles.syncButton} onPress={handleManualSync}>
              <Text style={styles.syncButtonText}>🔄 {t('sync_now')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- 3. VUE ENSEIGNANT (SAISIE DE NOTES, ATTENDANCE, INCIDENTS, MATERNELLE) --- */}
        {view === 'teacher' && (
          <Card>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
              <Text style={styles.cardTitle}>{t('teacher')}</Text>
              <View style={styles.schoolSelectorHeader}>
                <Text style={{color: '#FFCC00', fontSize: 11, fontWeight: 'bold'}}>{schools.find(sc => sc.id === selectedSchoolId)?.nom.split(' - ')[0]}</Text>
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={{flex: 1, marginRight: 5}}>
                <Text style={styles.label}>{t('class_filter')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection: 'row'}}>
                    {classesDisponibles.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.smallFilterBtn, selectedClass === c && styles.smallFilterBtnActive]}
                        onPress={() => setSelectedClass(c)}
                      >
                        <Text style={[styles.filterBtnText, selectedClass === c && styles.filterBtnTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={{marginTop: 15, marginBottom: 15}}>
              <Text style={styles.label}>{t('subject_filter')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection: 'row'}}>
                  {matieresDisponibles.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.smallFilterBtn, currentSubject === m && styles.smallFilterBtnActive]}
                      onPress={() => setCurrentSubject(m)}
                    >
                      <Text style={[styles.filterBtnText, currentSubject === m && styles.filterBtnTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Liste de saisie */}
            <Text style={styles.sectionTitle}>Saisie des Notes & Actions :</Text>
            {studentsList
              .filter(s => selectedClass === 'Toutes' || s.classe === selectedClass)
              .map(s => (
                <View key={s.id} style={styles.teacherStudentCard}>
                  <View style={styles.row}>
                    <Text style={styles.studentNameTeacher}>{s.prenom} {s.nom} ({s.classe})</Text>
                    <Input
                      placeholder="Nòt/10"
                      keyboardType="numeric"
                      style={{ width: 80, marginVertical: 0 }}
                      inputStyle={{ paddingVertical: 8, paddingHorizontal: 10, textAlign: 'center' }}
                      onChangeText={(val) => {
                        setNotesMap(prev => ({ ...prev, [s.id]: val }));
                      }}
                      value={notesMap[s.id] || ''}
                    />
                  </View>

                  {/* Boutons d'émargement de présence (Attendance) */}
                  <View style={styles.subSectionContainer}>
                    <Text style={styles.subSectionTitle}>{t('attendance_sec')}</Text>
                    <View style={styles.attendanceButtonsRow}>
                      <TouchableOpacity onPress={() => markPresence(s.id, 'Présent')} style={[styles.statusBtn, {backgroundColor: '#06D6A0'}]}>
                        <Text style={styles.statusBtnText}>{t('presence_p')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => markPresence(s.id, 'Absent')} style={[styles.statusBtn, {backgroundColor: '#D90429'}]}>
                        <Text style={styles.statusBtnText}>{t('presence_a')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => markPresence(s.id, 'En Retard')} style={[styles.statusBtn, {backgroundColor: '#FFCC00'}]}>
                        <Text style={[styles.statusBtnText, {color: '#0A1128'}]}>{t('presence_l')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Suivi Kindergarten exclusif */}
                  {s.classe === 'Kindergarten' && (
                    <View style={styles.subSectionContainer}>
                      <Text style={styles.subSectionTitle}>{t('liaison_sec')}</Text>
                      <View style={styles.attendanceButtonsRow}>
                        <TouchableOpacity onPress={() => saveKLog(s.id, 'repas', true)} style={[styles.statusBtn, {backgroundColor: '#1C2541'}]}>
                          <Text style={styles.statusBtnText}>🥣 Repas OUI</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => saveKLog(s.id, 'sieste', true)} style={[styles.statusBtn, {backgroundColor: '#1C2541'}]}>
                          <Text style={styles.statusBtnText}>😴 Sieste OUI</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Formulaire de signalement de discipline */}
                  <View style={styles.subSectionContainer}>
                    <Text style={styles.subSectionTitle}>{t('discipline_sec')}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                      <Input
                        placeholder="Texte de l'incident..."
                        value={disciplineNotes[s.id] || ''}
                        onChangeText={(text) => setDisciplineNotes(prev => ({...prev, [s.id]: text}))}
                        style={{ flex: 1, marginVertical: 0 }}
                        inputStyle={{ paddingVertical: 8 }}
                      />
                      <TouchableOpacity style={styles.disciplineBtn} onPress={() => addDisciplineIncident(s.id)}>
                        <Text style={styles.disciplineBtnText}>🚨</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

            <Button title={t('save_grades')} onPress={saveTeacherGrades} style={{ marginTop: 15 }} />
          </Card>
        )}

        {/* --- 4. VUE ENROLLMENT / INSCRIPTION (FORMULAIRE SECRETAIRE COMPLET) --- */}
        {view === 'enrollment' && (
          <View>
            {/* Formulaire Inscription */}
            <Card>
              <Text style={styles.cardTitle}>{t('reg_title')}</Text>

              <Input
                placeholder={t('reg_nom')}
                value={newStudent.nom}
                onChangeText={(val) => setNewStudent(prev => ({ ...prev, nom: val }))}
              />
              <Input
                placeholder={t('reg_prenom')}
                value={newStudent.prenom}
                onChangeText={(val) => setNewStudent(prev => ({ ...prev, prenom: val }))}
              />
              <Input
                placeholder={t('reg_parent_tel')}
                value={newStudent.telephone_parent}
                onChangeText={(val) => setNewStudent(prev => ({ ...prev, telephone_parent: val }))}
              />
              <Input
                placeholder={t('reg_solde')}
                keyboardType="numeric"
                value={newStudent.solde_du}
                onChangeText={(val) => setNewStudent(prev => ({ ...prev, solde_du: val }))}
              />

              <Text style={[styles.label, {marginTop: 15}]}>Classe :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 10}}>
                <View style={{flexDirection: 'row'}}>
                  {classesDisponibles.filter(c => c !== 'Toutes').map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.smallFilterBtn, newStudent.classe === c && styles.smallFilterBtnActive]}
                      onPress={() => setNewStudent(prev => ({ ...prev, classe: c }))}
                    >
                      <Text style={[styles.filterBtnText, newStudent.classe === c && styles.filterBtnTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Button title={t('reg_submit')} onPress={handleRegisterStudent} style={{ marginTop: 15 }} />
            </Card>

            {/* Registre des élèves existants */}
            <Text style={styles.sectionTitle}>Registre des Élèves Inscrits</Text>
            {studentsList.map(s => (
              <Card key={s.id}>
                <View style={styles.row}>
                   <Image source={{ uri: s.photo_url || 'https://via.placeholder.com/100' }} style={{width:50, height:50, borderRadius:25}} />
                   <View style={{marginLeft: 15, flex: 1}}>
                     <Text style={styles.bold}>{s.prenom} {s.nom}</Text>
                     <Text style={{color: '#666', fontSize: 12}}>{s.classe} | {s.solde_du} HTG</Text>
                   </View>
                </View>
                <View style={[styles.row, {marginTop: 10}]}>
                   <TouchableOpacity onPress={() => takePhoto(s.id)} style={styles.btnSmall}><Text>📸 Photo</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => {setStudent(s); setView('parent'); setSelectedSchoolId(s.ecole_id || schools[0].id);}} style={styles.btnSmall}><Text>👁️ Gade</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => updateDebt(s.id, 0)} style={styles.btnSmall}><Text>💰 Sòlde</Text></TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* --- 5. VUE SUPER-ADMIN PORTAL (SaaS Onboarding & Metrics Dashboard) --- */}
        {view === 'super_admin' && (
          <View>
            <Card>
              <Text style={styles.cardTitle}>{t('saas_title')}</Text>
              <Text style={styles.subtext}>{t('saas_subtitle')}</Text>

              <View style={styles.saasMetricsRow}>
                <View style={styles.saasKpiCard}>
                  <Text style={styles.saasKpiValue}>{schools.length}</Text>
                  <Text style={styles.saasKpiLabel}>Lekòl Anrejistre</Text>
                </View>
                <View style={styles.saasKpiCard}>
                  <Text style={styles.saasKpiValue}>{schools.length * 15}0$</Text>
                  <Text style={styles.saasKpiLabel}>SaaS ARR (HTG)</Text>
                </View>
              </View>
            </Card>

            {/* School Switcher for global management */}
            <Card>
              <Text style={styles.label}>{t('switch_school')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 10}}>
                <View style={{flexDirection: 'row'}}>
                  {schools.map(sch => (
                    <TouchableOpacity
                      key={sch.id}
                      style={[styles.smallFilterBtn, selectedSchoolId === sch.id && styles.smallFilterBtnActive]}
                      onPress={() => setSelectedSchoolId(sch.id)}
                    >
                      <Text style={[styles.filterBtnText, selectedSchoolId === sch.id && styles.filterBtnTextActive]}>{sch.nom}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={{color: '#8DA9C4', fontSize: 12, fontStyle: 'italic'}}>Super-Admin ap jere done lekòl sa a kounye a.</Text>
            </Card>

            {/* Onboarding Form */}
            <Card>
              <Text style={styles.cardTitle}>{t('saas_onboarding')}</Text>
              <Input
                placeholder={t('school_name')}
                value={newSchoolForm.nom}
                onChangeText={(text) => setNewSchoolForm(prev => ({ ...prev, nom: text }))}
              />
              <Input
                placeholder={t('school_subdomain')}
                value={newSchoolForm.subdomain}
                onChangeText={(text) => setNewSchoolForm(prev => ({ ...prev, subdomain: text }))}
              />
              <Button title={t('school_submit')} onPress={handleCreateSchool} style={{ marginTop: 15 }} />
            </Card>
          </View>
        )}

        {/* --- 6. VUE ADMIN STATS (SI ADMIN CONNECTÉ / MVP VERSION 0.1 DASHBOARD COMPLET) --- */}
        {view === 'admin' && (
          <View>
            {/* MVP v0.1 - Dashboard Éléments du Directeur */}
            <Card>
              <Text style={styles.cardTitle}>Estatistik Lekòl la (Dashboard v0.1)</Text>
              <Text style={styles.subtext}>Yon jeneral de aktivite lekòl la pou jodi a</Text>

              <View style={styles.saasMetricsRow}>
                <View style={styles.saasKpiCard}>
                  <Text style={styles.saasKpiValue}>{stats.totalStudents || 0}</Text>
                  <Text style={styles.saasKpiLabel}>Kantite Elèv</Text>
                </View>
                <View style={styles.saasKpiCard}>
                  <Text style={styles.saasKpiValue}>{stats.totalTeachers || 5}</Text>
                  <Text style={styles.saasKpiLabel}>Pwofesè Yo</Text>
                </View>
              </View>

              <View style={[styles.saasMetricsRow, { marginTop: 10 }]}>
                <View style={[styles.saasKpiCard, { backgroundColor: '#131A35', borderWidth: 1, borderColor: '#06D6A0' }]}>
                  <Text style={[styles.saasKpiValue, { color: '#06D6A0' }]}>{stats.todayAttendance || 94}%</Text>
                  <Text style={styles.saasKpiLabel}>Prezans Jodi a</Text>
                </View>
                <View style={[styles.saasKpiCard, { backgroundColor: '#131A35', borderWidth: 1, borderColor: '#FFCC00' }]}>
                  <Text style={[styles.saasKpiValue, { color: '#FFCC00' }]}>{stats.totalEncaisse || 0} HTG</Text>
                  <Text style={styles.saasKpiLabel}>Peman Mwa Sa a</Text>
                </View>
              </View>

              <View style={{ marginTop: 15 }}>
                <AlertBanner
                  title="Alèt Enpòtan"
                  message={`Gen ${stats.alertCount || 3} paran ki poko peye frè lekòl yo pou mwa sa a.`}
                  variant="warning"
                />
              </View>
            </Card>

            <Text style={styles.sectionTitle}>Fiches Élèves (Admin)</Text>
            {studentsList.map(s => (
              <Card key={s.id}>
                <View style={styles.row}>
                   <Image source={{ uri: s.photo_url || 'https://via.placeholder.com/100' }} style={{width:50, height:50, borderRadius:25}} />
                   <View style={{marginLeft: 15, flex: 1}}>
                     <Text style={styles.bold}>{s.prenom} {s.nom}</Text>
                     <Text style={{color: '#8DA9C4', fontSize: 12}}>{s.classe} | {s.solde_du} HTG</Text>
                   </View>
                </View>
                <View style={[styles.row, {marginTop: 10}]}>
                   <TouchableOpacity onPress={() => takePhoto(s.id)} style={styles.btnSmall}><Text>📸 Photo</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => {setStudent(s); setView('parent'); setSelectedSchoolId(s.ecole_id || schools[0].id);}} style={styles.btnSmall}><Text>👁️ Gade</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => updateDebt(s.id, 0)} style={styles.btnSmall}><Text>💰 Sòlde</Text></TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Global Design System Notification Toast */}
      <Toast message={toastMessage} visible={toastVisible} onDismiss={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  loginContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#0A1128', padding: 20 },
  loginCard: { backgroundColor: '#131A35', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 5 },
  logoBadge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFCC00', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  logoText: { fontSize: 36, fontWeight: 'bold', color: '#0A1128' },
  loginTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  loginSub: { fontSize: 16, color: '#8DA9C4', marginBottom: 20 },
  langToggleText: { color: '#FFCC00', fontWeight: 'bold' },

  header: { backgroundColor: '#131A35', padding: 20, paddingTop: 45, borderBottomWidth: 1, borderColor: '#1C2541' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 10 },
  miniLogo: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFCC00', justifyContent: 'center', alignItems: 'center', marginRight: 10, flexShrink: 0 },
  miniLogoText: { fontSize: 16, fontWeight: 'bold', color: '#0A1128' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#8DA9C4', fontSize: 12 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#06D6A0', marginRight: 5 },
  onlineText: { color: '#06D6A0', fontSize: 10, fontWeight: 'bold' },
  langBadge: { backgroundColor: '#1C2541', padding: 6, borderRadius: 8, marginRight: 10 },
  langText: { color: '#FFCC00', fontSize: 11, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#D90429', padding: 6, borderRadius: 8 },
  logoutText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  tabBar: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  tab: { flex: 1, backgroundColor: '#1C2541', padding: 10, marginHorizontal: 3, borderRadius: 8, alignItems:'center' },
  tabActive: { backgroundColor: '#FFCC00' },
  tabText: { fontSize: 11, fontWeight: 'bold', color: '#8DA9C4' },
  tabTextActive: { color: '#0A1128' },

  content: { padding: 15 },
  bold: { fontWeight: 'bold', color: '#FFFFFF' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtext: { color: '#8DA9C4', fontSize: 14, marginBottom: 15 },

  announcementBanner: { backgroundColor: '#3A0CA3', padding: 12, borderRadius: 12, marginBottom: 15 },
  announcementTitle: { color: '#FFCC00', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  announcementMsg: { color: '#FFF', fontSize: 13, marginTop: 3 },

  childSelectContainer: { backgroundColor: '#131A35', padding: 20, borderRadius: 15 },
  childGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 15 },
  childAvatarCard: { width: '45%', backgroundColor: '#1C2541', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  largeAvatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 10 },
  childAvatarName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  childAvatarClass: { color: '#8DA9C4', fontSize: 12 },

  horizontalScrollContainer: { marginBottom: 15 },
  avatarRow: { flexDirection: 'row', paddingVertical: 5 },
  avatarBadge: { alignItems: 'center', marginRight: 20, padding: 5, borderRadius: 12 },
  avatarBadgeActive: { backgroundColor: '#1C2541' },
  miniAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#FFCC00' },
  miniAvatarName: { color: '#8DA9C4', fontSize: 11, marginTop: 4 },
  miniAvatarNameActive: { color: '#FFCC00', fontWeight: 'bold' },

  mainAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15, borderWidth: 2, borderColor: '#FFCC00' },
  studentName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  studentClass: { color: '#8DA9C4', fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 8 },

  sectionTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 10 },

  kpiBox: { flex: 1, alignItems: 'center' },
  kpiLabel: { color: '#8DA9C4', fontSize: 11, textTransform: 'uppercase' },
  kpiValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 4 },

  gradesCardTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 10 },

  lockedContainer: { backgroundColor: '#4A0E17', padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  lockedIconBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#D90429', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  lockedTitle: { color: '#FFB3C1', fontSize: 20, fontWeight: 'bold' },
  lockedDesc: { color: '#FFB3C1', fontSize: 13, textAlign: 'center', marginTop: 8 },

  liaisonHeader: { color: '#FFCC00', fontWeight: 'bold', marginBottom: 10 },
  kLogContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 },
  kLogItem: { color: '#FFF', fontSize: 14 },

  disciplineLogItem: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#3A506B' },

  paymentLabel: { color: '#8DA9C4', fontSize: 12, textTransform: 'uppercase' },
  paymentAmount: { color: '#D90429', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  progressContainer: { marginTop: 15, marginBottom: 15 },
  progressBarBg: { height: 8, backgroundColor: '#1C2541', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#06D6A0' },
  progressText: { color: '#8DA9C4', fontSize: 11, marginTop: 5 },

  quickActionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionGridItem: { width: '22%', backgroundColor: '#131A35', padding: 12, borderRadius: 12, alignItems: 'center' },
  actionIcon: { fontSize: 22, marginBottom: 5 },
  actionLabel: { color: '#8DA9C4', fontSize: 11, fontWeight: 'bold' },

  syncButton: { padding: 12, alignItems: 'center' },
  syncButtonText: { color: '#8DA9C4', fontSize: 13 },

  filterRow: { flexDirection: 'row', marginTop: 10 },
  label: { color: '#8DA9C4', fontSize: 12, marginBottom: 5 },
  smallFilterBtn: { backgroundColor: '#1C2541', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 },
  smallFilterBtnActive: { backgroundColor: '#FFCC00' },
  filterBtnText: { color: '#8DA9C4', fontSize: 12 },
  filterBtnTextActive: { color: '#0A1128', fontWeight: 'bold' },

  teacherStudentCard: { backgroundColor: '#1C2541', padding: 12, borderRadius: 12, marginVertical: 8 },
  studentNameTeacher: { color: '#FFF', fontSize: 14, fontWeight: 'bold', flex: 1 },

  subSectionContainer: { marginTop: 10, borderTopWidth: 1, borderColor: '#3A506B', paddingTop: 8 },
  subSectionTitle: { color: '#8DA9C4', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  attendanceButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  statusBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 3, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statusBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  disciplineBtn: { backgroundColor: '#FFCC00', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  disciplineBtnText: { fontSize: 14 },

  btnSmall: { padding: 8, borderRadius: 5, backgroundColor: '#1C2541', marginTop: 5 },
  emptyText: { color: '#8DA9C4', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },

  schoolSelectorHeader: { backgroundColor: '#1C2541', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  saasMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  saasKpiCard: { flex: 1, backgroundColor: '#1C2541', padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  saasKpiValue: { color: '#FFCC00', fontSize: 24, fontWeight: 'bold' },
  saasKpiLabel: { color: '#8DA9C4', fontSize: 11, marginTop: 4 }
});
