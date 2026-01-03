#!/usr/bin/env pwsh

# Starting AI Studio Chat to Markdown Converter...
Write-Host "Starting AI Studio Chat to Markdown Converter...`n"

# Activate conda environment
conda activate ppocrv5structurev3

# Run Streamlit app
streamlit run app.py

# Pause to keep the window open
Read-Host -Prompt "Press Enter to exit"