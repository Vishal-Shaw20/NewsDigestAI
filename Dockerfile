# Use Miniconda base image
FROM continuumio/miniconda3:latest

# Set working directory
WORKDIR /app

# Copy environment.yml first for caching
COPY environment.yml .

# Create Conda environment
RUN conda env create -f environment.yml

# Ensure Bash is default shell
SHELL ["/bin/bash", "-c"]

# Activate env automatically in subsequent commands
RUN echo "source activate NewsDigestAI" >> ~/.bashrc

# Install gunicorn inside environment
RUN source activate NewsDigestAI && pip install gunicorn

# Copy project files
COPY ./src ./src
COPY README.md README.md

# Expose API port
EXPOSE 5000

# Start the server (VERY IMPORTANT: logs go to stdout)
CMD source activate NewsDigestAI && gunicorn --chdir /app/src app:app --bind 0.0.0.0:5000 --access-logfile - --error-logfile -
