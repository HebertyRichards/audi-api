import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profileService';
import { getErrorMessage } from '../helpers/Message';
import { AuthenticatedRequest } from '../types/auth';

export async function getProfile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const profile = await profileService.getProfileById(id);
    res.status(200).json(profile);
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.startsWith('NOT_FOUND')) {
      const userMessage = message.split(':')[1] || 'Perfil não encontrado.';
      return res.status(404).json({ error: userMessage });
    } else {
      return res.status(500).json({ error: message });
    }
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await profileService.getAllProfiles(page, limit);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    if (message.startsWith('NOT_FOUND')) {
      return res.status(404).json({ error: message.split(':')[1] });
    } else {
      return res.status(500).json({ message: message });
    }
  }
}

export async function updateUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    
    const userId = req.user.id;
    const profileData = req.body;

    const result = await profileService.updateProfile({ ...profileData, id: userId });
    return res.status(200).json(result);

  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.startsWith('BAD_REQUEST')) {
      return res.status(400).json({ error: message.split(':')[1] });
    }
    if (message.startsWith('NOT_FOUND')) {
      return res.status(404).json({ error: message.split(':')[1] });
    }
    if (message.startsWith('CONFLICT')) {
      return res.status(409).json({ error: message.split(':')[1] });
    } else {
      next(error);
    }
  }
}

export async function deleteUserProfile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await profileService.DeleteProfile(id);
    res.status(204).send();
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.startsWith('NOT_FOUND')) {
      const userMessage = message.split(':')[1] || 'Perfil não encontrado.';
      return res.status(404).json({ error: userMessage });
    } else {
      return res.status(500).json({ error: message });
    }
  }
}

export async function getUserProfile(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const profile = await profileService.getUserProfileByUsername(username);
    res.status(200).json(profile);
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.startsWith('NOT_FOUND')) {
      const userMessage = message.split(':')[1] || 'Usuário não encontrado.';
      return res.status(404).json({ error: userMessage });
    } else {
      return res.status(500).json({ error: message });
    }
  }
}

export async function updateAvatarProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const token = req.cookies['sb-access-token'];

    if (!token) {
        return res.status(401).json({ error: "Token de sessão não encontrado." });
    }
    const userId = req.user.id;
    const avatarFile = req.file;

    if (!avatarFile) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }
    const result = await profileService.updateAvatar(userId, avatarFile, token);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message.startsWith('BAD_REQUEST')) {
      return res.status(400).json({ error: message.split(':')[1] });
    }
    if (message.startsWith('NOT_FOUND')) {
      return res.status(404).json({ error: message.split(':')[1] });
    } else {
      next(error); 
    }
  }
}

export async function deleteAvatarProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const userId = req.user.id;
    const result = await profileService.deleteAvatar(userId);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message.startsWith('BAD_REQUEST')) {
      return res.status(400).json({ error: message.split(':')[1] });
    }
    if (message.startsWith('NOT_FOUND')) {
      return res.status(404).json({ error: message.split(':')[1] });
    } else {
      next(error); 
    }
  }
}

export async function follow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const followerId = req.user.id;
    const followingId = req.params.id;
    const result = await profileService.followUser(followerId, followingId);
    res.status(200).json(result);
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.startsWith('BAD_REQUEST')) 
      return res.status(400).json({ error: message.split(':')[1] });
    if (message.startsWith('CONFLICT')) 
      return res.status(409).json({ error: message.split(':')[1] });
    next(error);
  }
}

export async function unfollow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const followerId = req.user.id;
    const followingId = req.params.id;
    const result = await profileService.unfollowUser(followerId, followingId);
    res.status(200).json(result);
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.startsWith('BAD_REQUEST')) 
      return res.status(400).json({ error: message.split(':')[1] });
    if (message.startsWith('NOT_FOUND')) 
      return res.status(404).json({ error: message.split(':')[1] });
    next(error);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    const stats = await profileService.getFollowStats(userId);
    return res.status(200).json(stats);
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.startsWith('NOT_FOUND')) 
      return res.status(404).json({ error: message.split(':')[1] });
    next(error);
  }
}

export async function getFollowersList(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    const followers = await profileService.getFollowers(userId);
    return res.status(200).json(followers);
  } catch (error) {
    next(error);
  }
}

export async function getFollowingList(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    const following = await profileService.getFollowing(userId);
    return res.status(200).json(following);
  } catch (error) {
    next(error);
  }
}
