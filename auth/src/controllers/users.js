import User from "../models/user.js";
import * as authService from "../services/auth.js";
import { HttpError } from "../utils/http-error.js";
import { getQueryOptions } from "../utils/query-options.js";

const defaultFields = ["email", "createdAt", "updatedAt"];

export async function createUser(req, res) {
  const user = await authService.register(req.body);
  res.status(201).json(user);
}

export async function loginUser(req, res) {
  const token = await authService.login(req.body);
  res.json({ message: "Authentication successful", token });
}

export async function getCurrentUser(req, res) {
  const user = await findUser(req.user.sub);
  res.json(user);
}

export async function getUser(req, res) {
  const user = await findUser(req.params.userId);
  res.json(user);
}

export async function searchUsers(req, res) {
  const options = getQueryOptions(req.query, defaultFields);
  const [result, total, totalFiltered] = await Promise.all([
    User.find(options.filter, options.fields)
      .sort(options.sort)
      .limit(options.limit)
      .skip(options.limit * (options.page - 1))
      .lean(),
    User.countDocuments(),
    User.countDocuments(options.filter)
  ]);

  res.json({ options: { ...options, total, totalFiltered }, result });
}

export async function updateUser(req, res) {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();

  if (!user) {
    throw new HttpError(404, "User not found");
  }
  res.json(user);
}

export async function removeUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.userId).lean();
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  res.json(user);
}

async function findUser(id) {
  const user = await User.findById(id).lean();
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return user;
}
