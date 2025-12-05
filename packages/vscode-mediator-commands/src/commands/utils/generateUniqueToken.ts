import { nanoid } from 'nanoid/async';

export const generateUniqueToken = () => nanoid(32);
