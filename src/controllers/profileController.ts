import { Request, Response } from 'express';
import * as profileService from '../services/profileService';

export async function getProfile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const profile = await profileService.getProfileById(id);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
} 

export async function updateUserProfile(req: Request, res: Response) {
  try {
    const result = await profileService.updateProfile(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteUserProfile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await profileService.DeleteProfile(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
