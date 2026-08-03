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

export default function App() {
  // --- ÉTATS SYSTEMES & SAAS (MULTI-TENANT) ---
  const [lang, setLang] = useState('ht'); // Par défaut Kreyòl (ht)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');  // 'super_admin', 'school_admin', 'teacher', 'secretary', 'parent'
  const [view, setView] = useState('');  // Vues associées
  const [loginPhone, setLoginPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- ÉTATS SAAS (ÉCOLES / TENANTS) ---
  const [selectedSchoolId, setSelectedSchoolId] = useState(''); // École courante pour les opérations
  const [schools, setSchools] = useState([
    { id: 'ecole_lpm_001', nom: 'Lekòl Pam - Delmas', logo: 'https://via.placeholder.com/80/1A365D/FFFFFF?text=LPM', subdomain: 'delmas', statut_abonnement: 'active', theme_color: '#0A1128' },
    { id: 'ecole_lpm_002', nom: 'Collège de la Trinité - Pétion-Ville', logo: 'https://via.placeholder.com/80/D90429/FFFFFF?text=TRINITE', subdomain: 'trinite', statut_abonnement: 'active', theme_color: '#1C2541' },
    { id: 'ecole_lpm_003', nom: 'Institution Saint-Louis de Gonzague', logo: 'https://via.placeholder.com/80/06D6A0/FFFFFF?text=SLG', subdomain: 'slg', statut_abonnement: 'active', theme_color: '#131A35' }
  ]);
  const [schoolStats, setSchoolStats] = useState({}); // Statistiques SaaS par école

  // --- ÉTATS DONNÉES ÉLÈVES (FILTRÉS PAR ECOLE_ID) ---
  const [student, setStudent] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [grades, setGrades] = useState([]);
  const [calculatedAverage, setCalculatedAverage] = useState(0);
  const [rank, setRank] = useState('...');
  const [totalClass, setTotalClass] = useState(0);
  const [presenceStatus, setPresenceStatus] = useState('...');
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ totalEncaisse: 0 });
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
        setStats({ totalEncaisse: encaisse });
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
    Alert.alert("Senkronizasyon", "Tout done yo mizajou avèk siksè!");
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
    Alert.alert("Info", "Téléchargement de la photo...");
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

  // --- CONNEXION & AUTHENTIFICATION (SaaS Multi-tenant Aware) ---
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
        // Super-Admin du SaaS global (gère toutes les écoles et l'onboarding)
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
        // Connexion d'un parent
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

      Alert.alert("Siksè", `Elèv la ${newStudent.prenom} ${newStudent.nom} anrejistre byen!`);
      // Réinitialiser la fiche élève
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
      // Vérifier si la présence existe déjà pour aujourd'hui
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
      Alert.alert("Prezans", `Siyalman "${status}" la anrejistre.`);
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
      Alert.alert("Kindergarten", "Cahier de liaison mis à jour avec succès.");
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
      Alert.alert("Siksè", "Ensidan disiplin anrejistre byen.");
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
      Alert.alert("Siksè", "Nòt yo anrejistre byen.");
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
    Alert.alert("SaaS Success", "Lekòl la kreye ak siksè ! Ou ka kòmanse enskri elèv yo.");
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

        <TextInput
          placeholder={t('input_placeholder')}
          placeholderTextColor="#7D8597"
          style={styles.input}
          value={loginPhone}
          onChangeText={setLoginPhone}
          keyboardType="default"
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginBtnText}>{t('connect')}</Text>}
        </TouchableOpacity>

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
          <View style={styles.childSelectContainer}>
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
          </View>
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
            <View style={styles.studentMainCard}>
               <View style={styles.row}>
                  <Image source={{ uri: student.photo_url || 'https://via.placeholder.com/100' }} style={styles.mainAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{student.prenom} {student.nom}</Text>
                    <Text style={styles.studentClass}>{student.classe}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.statusBadge, {backgroundColor: student.solde_du > 1000 ? '#D90429' : '#06D6A0'}]}>
                        <Text style={styles.badgeText}>{student.solde_du > 1000 ? 'An reta peman' : 'Kont règle'}</Text>
                      </View>
                      <View style={[styles.statusBadge, {backgroundColor: '#1E293B'}]}>
                        <Text style={styles.badgeText}>{t('presence')}: {presenceStatus}</Text>
                      </View>
                    </View>
                  </View>
               </View>
            </View>

            {/* BARRE DE SÉLECTION DE TRIMESTRE */}
            <View style={styles.periodSelector}>
              <Text style={styles.sectionTitle}>{t('term')} :</Text>
              <View style={styles.periodButtonsContainer}>
                {[1, 2, 3].map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setSelectedPeriode(p)}
                    style={[styles.periodBtn, selectedPeriode === p && styles.periodBtnActive]}
                  >
                    <Text style={[styles.periodBtnText, selectedPeriode === p && styles.periodBtnTextActive]}>T{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* BULLETIN (SI COMPTE EN RÈGLE OU PETITE DETTE < 1000 HTG) */}
            {student.solde_du <= 1000 ? (
              <View>
                {/* MOYENNE ET RANG */}
                <View style={[styles.kpiCard, {backgroundColor:'#131A35'}]}>
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
                </View>

                {/* TABLEAU DES NOTES EN DIRECT */}
                <View style={styles.gradesCard}>
                  <Text style={styles.gradesCardTitle}>Nòt pou Trimès sa a</Text>
                  {grades.length === 0 ? (
                    <Text style={styles.emptyText}>Pa gen nòt ki anrejistre pou trimès sa a.</Text>
                  ) : (
                    grades.map((g, index) => (
                      <View key={index} style={styles.gradeRow}>
                        <Text style={styles.gradeMatiere}>{g.matiere}</Text>
                        <Text style={styles.gradeCoef}>Coef: {g.coefficient || 1}</Text>
                        <Text style={styles.gradeNote}>{g.note}/10</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ) : (
              /* BULLETIN BLOQUÉ POUR NON-PAIEMENT (CONFORME AUX CAPTURES D'ÉCRAN) */
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
              <View style={styles.card}>
                <Text style={styles.liaisonHeader}>{t('cahier_liaison')}</Text>
                {kLog ? (
                  <View style={styles.kLogContainer}>
                    <Text style={styles.kLogItem}>🥣 {t('repas')} : <Text style={styles.bold}>{kLog.repas ? '✅ Oui' : '❌ Non'}</Text></Text>
                    <Text style={styles.kLogItem}>😴 {t('sieste')} : <Text style={styles.bold}>{kLog.sieste ? '✅ Oui' : '❌ Non'}</Text></Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>Pa gen done anrejistre pou jodi a.</Text>
                )}
              </View>
            )}

            {/* RAPPORT DE DISCIPLINE (DANS LE PORTAIL PARAN POUR LA MAQUETTE COMPLETE) */}
            {disciplineLogs.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.liaisonHeader}>{t('discipline_parent_title')}</Text>
                {disciplineLogs.map((log) => (
                  <View key={log.id} style={styles.disciplineLogItem}>
                    <Text style={{color: '#FFB3C1', fontSize: 13, fontWeight: 'bold'}}>{log.date_incident}</Text>
                    <Text style={{color: '#FFF', fontSize: 13, marginTop: 2}}>{log.incident}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* SOLDE BANCAIRE ET OPTIONS DE PAIEMENT (MONCASH EXCLUSIF) */}
            <View style={styles.paymentCard}>
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
                 <TouchableOpacity style={styles.monCashBtn} onPress={() => {
                   Alert.alert("MonCash", "Peman simulation an kòmanse...");
                   updateDebt(student.id, 0);
                 }}>
                   <Text style={styles.monCashText}>💳 {t('pay')}</Text>
                 </TouchableOpacity>
               )}

               <TouchableOpacity
                 disabled={student.solde_du > 1000}
                 style={[styles.btnAction, student.solde_du > 1000 && styles.btnActionDisabled]}
                 onPress={generatePDF}
               >
                 <Text style={styles.btnActionText}>{student.solde_du > 1000 ? t('locked') : t('bulletin_btn')}</Text>
               </TouchableOpacity>
            </View>

            {/* GRILLE D'ACTIONS RAPIDES DE LA MAQUETTE */}
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
          <View style={styles.card}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
              <Text style={styles.cardTitle}>{t('teacher')}</Text>
              {/* Sélecteur d'école active pour le personnel */}
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
                  {/* Ligne Infos */}
                  <View style={styles.row}>
                    <Text style={styles.studentNameTeacher}>{s.prenom} {s.nom} ({s.classe})</Text>
                    <TextInput
                      placeholder="Note /10"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      style={styles.gradeInput}
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

                  {/* Suivi Kindergarten exclusif (Si élève Kindergarten) */}
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

                  {/* Formulaire de signalement de discipline (Discipline Log - Table: disciplines) */}
                  <View style={styles.subSectionContainer}>
                    <Text style={styles.subSectionTitle}>{t('discipline_sec')}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                      <TextInput
                        placeholder="Texte de l'incident..."
                        placeholderTextColor="#7D8597"
                        value={disciplineNotes[s.id] || ''}
                        onChangeText={(text) => setDisciplineNotes(prev => ({...prev, [s.id]: text}))}
                        style={styles.disciplineInput}
                      />
                      <TouchableOpacity style={styles.disciplineBtn} onPress={() => addDisciplineIncident(s.id)}>
                        <Text style={styles.disciplineBtnText}>🚨</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

            <TouchableOpacity style={styles.saveBtn} onPress={saveTeacherGrades}>
              <Text style={styles.saveBtnText}>{t('save_grades')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- 4. VUE ENROLLMENT / INSCRIPTION (FORMULAIRE SECRETAIRE COMPLET) --- */}
        {view === 'enrollment' && (
          <View>
            {/* Formulaire Inscription */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('reg_title')}</Text>

              <TextInput
                placeholder={t('reg_nom')}
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={newStudent.nom}
                onChangeText={(val) => setNewStudent(prev => ({ ...prev, nom: val }))}
              />
              <TextInput
                placeholder={t('reg_prenom')}
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={newStudent.prenom}
                onChangeText={(val) => setNewStudent(prev => ({ ...prev, prenom: val }))}
              />
              <TextInput
                placeholder={t('reg_parent_tel')}
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={newStudent.telephone_parent}
                onChangeText={(val) => setNewStudent(prev => ({ ...prev, telephone_parent: val }))}
              />
              <TextInput
                placeholder={t('reg_solde')}
                placeholderTextColor="#7D8597"
                keyboardType="numeric"
                style={styles.input}
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

              <TouchableOpacity style={styles.saveBtn} onPress={handleRegisterStudent}>
                <Text style={styles.saveBtnText}>{t('reg_submit')}</Text>
              </TouchableOpacity>
            </View>

            {/* Registre des élèves existants */}
            <Text style={styles.sectionTitle}>Registre des Élèves Inscrits</Text>
            {studentsList.map(s => (
              <View key={s.id} style={styles.card}>
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
              </View>
            ))}
          </View>
        )}

        {/* --- 5. VUE SUPER-ADMIN PORTAL (SaaS Onboarding & Metrics Dashboard) --- */}
        {view === 'super_admin' && (
          <View>
            <View style={styles.card}>
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
            </View>

            {/* School Switcher for global management */}
            <View style={styles.card}>
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
            </View>

            {/* Onboarding Form */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('saas_onboarding')}</Text>
              <TextInput
                placeholder={t('school_name')}
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={newSchoolForm.nom}
                onChangeText={(text) => setNewSchoolForm(prev => ({ ...prev, nom: text }))}
              />
              <TextInput
                placeholder={t('school_subdomain')}
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={newSchoolForm.subdomain}
                onChangeText={(text) => setNewSchoolForm(prev => ({ ...prev, subdomain: text }))}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateSchool}>
                <Text style={styles.saveBtnText}>{t('school_submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- 6. VUE ADMIN STATS (SI ADMIN CONNECTÉ) --- */}
        {view === 'admin' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Statistiques Financières</Text>
              <Text style={styles.subtext}>Total Frais Encaissés :</Text>
              <Text style={{color: '#06D6A0', fontSize: 32, fontWeight: 'bold'}}>{stats.totalEncaisse} HTG</Text>
            </View>

            <Text style={styles.sectionTitle}>Fiches Élèves (Admin)</Text>
            {studentsList.map(s => (
              <View key={s.id} style={styles.card}>
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
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' }, // Fond sombre Premium conforme
  loginContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#0A1128', padding: 20 },
  loginCard: { backgroundColor: '#131A35', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 5 },
  logoBadge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFCC00', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  logoText: { fontSize: 36, fontWeight: 'bold', color: '#0A1128' },
  loginTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  loginSub: { fontSize: 16, color: '#8DA9C4', marginBottom: 20 },
  input: { width:'100%', backgroundColor: '#1C2541', color: '#FFFFFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#3A506B', marginTop: 15 },
  loginBtn: { width:'100%', backgroundColor: '#FFCC00', padding: 18, borderRadius: 12, marginTop: 25, alignItems: 'center' },
  loginBtnText: { color: '#0A1128', fontWeight: 'bold', fontSize: 16 },
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
  card: { backgroundColor: '#131A35', padding: 15, borderRadius: 15, marginBottom: 15 },
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

  studentMainCard: { backgroundColor: '#131A35', padding: 18, borderRadius: 15, marginBottom: 15 },
  mainAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15, borderWidth: 2, borderColor: '#FFCC00' },
  studentName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  studentClass: { color: '#8DA9C4', fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  periodSelector: { backgroundColor: '#131A35', padding: 15, borderRadius: 15, marginBottom: 15 },
  sectionTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 10 },
  periodButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  periodBtn: { flex: 1, backgroundColor: '#1C2541', padding: 10, marginHorizontal: 5, borderRadius: 8, alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#FFCC00' },
  periodBtnText: { color: '#8DA9C4', fontWeight: 'bold' },
  periodBtnTextActive: { color: '#0A1128' },

  kpiCard: { padding: 15, borderRadius: 15, marginBottom: 15 },
  kpiBox: { flex: 1, alignItems: 'center' },
  kpiLabel: { color: '#8DA9C4', fontSize: 11, textTransform: 'uppercase' },
  kpiValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 4 },

  gradesCard: { backgroundColor: '#131A35', padding: 15, borderRadius: 15, marginBottom: 15 },
  gradesCardTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 10 },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#1C2541' },
  gradeMatiere: { color: '#FFF', flex: 2, fontSize: 14 },
  gradeCoef: { color: '#8DA9C4', flex: 1, fontSize: 12, textAlign: 'center' },
  gradeNote: { color: '#FFCC00', fontWeight: 'bold', fontSize: 14 },

  lockedContainer: { backgroundColor: '#4A0E17', padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  lockedIconBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#D90429', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  lockedTitle: { color: '#FFB3C1', fontSize: 20, fontWeight: 'bold' },
  lockedDesc: { color: '#FFB3C1', fontSize: 13, textAlign: 'center', marginTop: 8 },

  liaisonHeader: { color: '#FFCC00', fontWeight: 'bold', marginBottom: 10 },
  kLogContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 },
  kLogItem: { color: '#FFF', fontSize: 14 },

  disciplineLogItem: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#3A506B' },

  paymentCard: { backgroundColor: '#131A35', padding: 18, borderRadius: 15, marginBottom: 15 },
  paymentLabel: { color: '#8DA9C4', fontSize: 12, textTransform: 'uppercase' },
  paymentAmount: { color: '#D90429', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  progressContainer: { marginTop: 15, marginBottom: 15 },
  progressBarBg: { height: 8, backgroundColor: '#1C2541', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#06D6A0' },
  progressText: { color: '#8DA9C4', fontSize: 11, marginTop: 5 },
  monCashBtn: { backgroundColor: '#FFCC00', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  monCashText: { color: '#0A1128', fontWeight: 'bold', fontSize: 15 },
  btnAction: { backgroundColor: '#1C2541', padding: 12, borderRadius: 10, alignItems: 'center' },
  btnActionDisabled: { opacity: 0.5 },
  btnActionText: { color: '#FFF', fontWeight: 'bold' },

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
  gradeInput: { backgroundColor: '#0A1128', color: '#FFF', padding: 8, borderRadius: 8, width: 80, textAlign: 'center' },

  subSectionContainer: { marginTop: 10, borderTopWidth: 1, borderColor: '#3A506B', paddingTop: 8 },
  subSectionTitle: { color: '#8DA9C4', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  attendanceButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  statusBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 3, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statusBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  disciplineInput: { flex: 1, backgroundColor: '#0A1128', color: '#FFF', padding: 8, borderRadius: 8, fontSize: 12 },
  disciplineBtn: { backgroundColor: '#FFCC00', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  disciplineBtnText: { fontSize: 14 },

  saveBtn: { backgroundColor: '#FFCC00', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#0A1128', fontWeight: 'bold' },

  btnSmall: { padding: 8, borderRadius: 5, backgroundColor: '#1C2541', marginTop: 5 },
  emptyText: { color: '#8DA9C4', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },

  schoolSelectorHeader: { backgroundColor: '#1C2541', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  saasMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  saasKpiCard: { flex: 1, backgroundColor: '#1C2541', padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  saasKpiValue: { color: '#FFCC00', fontSize: 24, fontWeight: 'bold' },
  saasKpiLabel: { color: '#8DA9C4', fontSize: 11, marginTop: 4 }
});
