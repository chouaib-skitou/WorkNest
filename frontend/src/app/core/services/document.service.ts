import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces for responses
export interface DocumentData {
  id: string;
  name: string;
  location: string;
}

export interface DocumentResponse {
  message: string;
  data: DocumentData;
}

export interface ListDocumentsResponse {
  message: string;
  data: {
    nextPageToken?: string;
    files: DocumentData[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private baseUrl = environment.storageServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generates a random 6-character hex string
   * @returns A 6-character hex string (e.g., "3f4a9c")
   */
  private generateHexCode(): string {
    return Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  /**
   * Creates a unique filename by adding a 6-character hex code
   * @param originalName The original filename
   * @returns A unique filename with a hex code inserted before the extension
   */
  private createUniqueFilename(originalName: string): string {
    const hexCode = this.generateHexCode();
    const lastDotIndex = originalName.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      // No extension
      return `${originalName}_${hexCode}`;
    }
    
    const nameWithoutExtension = originalName.substring(0, lastDotIndex);
    const extension = originalName.substring(lastDotIndex);
    return `${nameWithoutExtension}_${hexCode}${extension}`;
  }

  /**
   * Get authorization headers with the current access token
   * @returns HttpHeaders with Authorization header
   */
  private getAuthHeaders(): HttpHeaders {
    const accessToken = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
  }

  /**
   * Handles HTTP errors
   * @param error The error to process
   * @returns An error Observable
   */
  private handleError(error: unknown): Observable<never> {
    let errorMessage =
      'An unknown error occurred while processing the document';

    if (typeof error === 'object' && error !== null) {
      // We can add more specific checks here
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
    }

    console.error('Document service error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Uploads a new document with a unique filename.
   * Expects a File object from a file input.
   * Returns an Observable with the document response.
   */
  createDocument(file: File): Observable<DocumentResponse> {
    // Create a unique filename
    const uniqueFilename = this.createUniqueFilename(file.name);
    
    // Create a new File object with the unique name
    const uniqueFile = new File([file], uniqueFilename, { 
      type: file.type,
      lastModified: file.lastModified 
    });
    
    const formData = new FormData();
    formData.append('file', uniqueFile);

    // Get auth headers
    const headers = this.getAuthHeaders();
    
    console.log(`Uploading file with unique name: ${uniqueFilename}`);

    // Use the observe: 'response' configuration to get the HTTP status
    return this.http
      .post<DocumentResponse>(this.baseUrl, formData, { 
        headers,
        observe: 'response'
      })
      .pipe(
        map((response) => {
          // If we receive a 201 status, it's a success, even if the body is empty
          if (response.status === 201) {
            // Return a valid response object, even if the body is null
            return (
              response.body || {
                message: 'Document uploaded successfully',
                data: {
                  id: uniqueFilename,
                  name: uniqueFilename,
                  location: 'document-location',
                },
              }
            );
          }
          return (
            response.body || {
              message: 'Unknown response',
              data: undefined as unknown as DocumentData,
            }
          );
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Updates an existing document
   * @param fileId ID of the document to update
   * @param file Optional new file content
   * @param newName Optional new name for the document
   * @returns Observable with the updated document response
   */
  updateDocument(
    fileId: string,
    file?: File,
    newName?: string
  ): Observable<DocumentResponse> {
    const formData = new FormData();
    if (file) {
      // If updating with a new file, make that filename unique too
      const uniqueFilename = this.createUniqueFilename(file.name);
      const uniqueFile = new File([file], uniqueFilename, { 
        type: file.type,
        lastModified: file.lastModified 
      });
      formData.append('file', uniqueFile);
      
      // If no new name was explicitly provided, use the unique filename
      if (!newName) {
        formData.append('newName', uniqueFilename);
      }
    }
    
    if (newName) {
      // If a new name was provided, make it unique
      const uniqueNewName = this.createUniqueFilename(newName);
      formData.append('newName', uniqueNewName);
    }
    
    // Get auth headers
    const headers = this.getAuthHeaders();

    return this.http.put<DocumentResponse>(
      `${this.baseUrl}/${fileId}`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a document
   * @param fileId ID of the document to delete
   * @returns Observable with the deletion confirmation
   */
  deleteDocument(fileId: string): Observable<{ message: string }> {
    // Get auth headers
    const headers = this.getAuthHeaders();

    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${fileId}`,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Lists all documents with optional pagination
   * @param pageSize Number of documents per page
   * @param pageToken Token for the next page
   * @returns Observable with the list of documents
   */
  listDocuments(
    pageSize?: number,
    pageToken?: string
  ): Observable<ListDocumentsResponse> {
    let params = new HttpParams();
    if (pageSize) {
      params = params.set('pageSize', pageSize.toString());
    }
    if (pageToken) {
      params = params.set('pageToken', pageToken);
    }
    
    // Get auth headers
    const headers = this.getAuthHeaders();

    return this.http.get<ListDocumentsResponse>(
      this.baseUrl, 
      { 
        headers,
        params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Gets a single document by ID
   * @param fileId ID of the document to retrieve
   * @returns Observable with the document data
   */
  getDocument(fileId: string): Observable<DocumentResponse> {
    // Get auth headers
    const headers = this.getAuthHeaders();

    return this.http.get<DocumentResponse>(
      `${this.baseUrl}/${fileId}`,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }
}