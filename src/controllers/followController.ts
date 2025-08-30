import { Request, Response, NextFunction } from 'express';
import * as followService from '../services/followService';
import { AuthenticatedRequest } from '../types/auth';
import { handleControllerError } from '../helpers/ErrorUtils';


export async function follow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }
      const followerId = req.user.id;
      const followingUsername = req.params.username;
      const result = await followService.followUser(followerId, followingUsername);
      res.status(200).json(result);
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }
  
  export async function unfollow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }
      const followerId = req.user.id;
      const followingUsername = req.params.username;
      const result = await followService.unfollowUser(followerId, followingUsername);
      res.status(200).json(result);
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }
  
  export async function getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const username = req.params.username;
      const stats = await followService.getFollowStats(username);
      return res.status(200).json(stats);
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }
  
  export async function getFollowersList(req: Request, res: Response, next: NextFunction) {
    try {
      const username = req.params.username;
      const followers = await followService.getFollowers(username);
      return res.status(200).json(followers);
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }
  
  export async function getFollowingList(req: Request, res: Response, next: NextFunction) {
    try {
      const username = req.params.username;
      const following = await followService.getFollowing(username);
      return res.status(200).json(following);
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }
  
  export async function checkIsFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }
      const followerId = req.user.id;
      const followingUsername = req.params.username;
      const result = await followService.checkFollowingStatus(followerId, followingUsername);
      res.status(200).json(result);
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }