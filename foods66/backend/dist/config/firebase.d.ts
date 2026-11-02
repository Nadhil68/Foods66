import { Firestore } from 'firebase-admin/firestore';
import { Auth } from 'firebase-admin/auth';
export declare const initFirebase: () => {
    db: Firestore;
    auth: Auth;
};
export declare const getFirestore: () => Firestore;
export declare const getFirebaseAuth: () => Auth;
declare const _default: {
    initFirebase: () => {
        db: Firestore;
        auth: Auth;
    };
    getFirestore: () => Firestore;
    getFirebaseAuth: () => Auth;
};
export default _default;
//# sourceMappingURL=firebase.d.ts.map